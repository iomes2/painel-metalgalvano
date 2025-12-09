/**
 * Cliente API - Camada de abstração para Firebase e Backend
 *
 * Este módulo fornece uma interface unificada para operações de dados,
 * permitindo alternar entre Firebase (atual) e Backend (migração) via feature flag.
 */

import { auth, db, storage } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

// Configuração
const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "true";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ==================== TIPOS ====================

export interface Gerente {
  id: string;
  nome: string;
}

export interface ReportPhoto {
  id?: string; // opcional para compatibilidade com Firebase fallback
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ReportData {
  id: string;
  formName: string;
  formType: string;
  submittedAt: Date | Timestamp;
  formData: Record<string, any>;
  photoUrls?: ReportPhoto[];
  submittedBy?: string;
  gerenteId?: string;
  originatingFormId?: string;
}

export interface OsData {
  id: string;
  os: string;
  lastReportAt: Date | Timestamp;
}

// ==================== HELPERS ====================

/**
 * Obtém token JWT do Firebase
 * Tenta obter do Firebase Auth e salva no localStorage como fallback
 */
async function getAuthToken(): Promise<string | null> {
  // Tentar obter do localStorage primeiro (fallback)
  if (typeof window !== "undefined") {
    const storedToken = localStorage.getItem("firebase_token");
    const tokenExpiry = localStorage.getItem("firebase_token_expiry");

    // Se há token salvo e ainda não expirou, usar ele
    if (storedToken && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry, 10);
      if (Date.now() < expiryTime) {
        console.log("[api-client] Token recuperado do localStorage");
        return storedToken;
      } else {
        // Token expirado, remover do localStorage
        localStorage.removeItem("firebase_token");
        localStorage.removeItem("firebase_token_expiry");
      }
    }
  }

  // Obter token do Firebase Auth
  const user = auth.currentUser;
  if (!user) {
    console.error("[api-client] Nenhum usuário autenticado no Firebase");
    return null;
  }

  try {
    // Obter token do Firebase (sem forçar atualização, usa cache se válido)
    const token = await user.getIdToken();

    // Salvar token no localStorage como fallback (válido por 50 minutos)
    if (typeof window !== "undefined" && token) {
      const expiryTime = Date.now() + 50 * 60 * 1000; // 50 minutos
      localStorage.setItem("firebase_token", token);
      localStorage.setItem("firebase_token_expiry", expiryTime.toString());
    }

    console.log(
      "[api-client] Token obtido com sucesso:",
      token.substring(0, 20) + "..."
    );
    return token;
  } catch (error) {
    console.error("[api-client] Erro ao obter token:", error);

    // Limpar token inválido do localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("firebase_token");
      localStorage.removeItem("firebase_token_expiry");
    }

    return null;
  }
}

/**
 * Faz requisição ao backend com autenticação
 */
async function fetchBackend(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error("Usuário não autenticado. Faça login para continuar.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const retryResponse = await handle401Retry(endpoint, options);
      if (retryResponse) return retryResponse;
    }

    const errorData = await response
      .json()
      .catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(errorData.message || `Erro ${response.status}`);
  }

  return response;
}

async function handle401Retry(
  endpoint: string,
  options: RequestInit
): Promise<Response | null> {
  console.warn("[api-client] Token inválido ou expirado, limpando cache");
  if (typeof window !== "undefined") {
    localStorage.removeItem("firebase_token");
    localStorage.removeItem("firebase_token_expiry");
  }

  const user = auth.currentUser;
  if (!user) return null;

  try {
    const newToken = await user.getIdToken(true);

    if (typeof window !== "undefined" && newToken) {
      const expiryTime = Date.now() + 50 * 60 * 1000;
      localStorage.setItem("firebase_token", newToken);
      localStorage.setItem("firebase_token_expiry", expiryTime.toString());
    }

    const retryHeaders = new Headers(options.headers);
    retryHeaders.set("Authorization", `Bearer ${newToken}`);
    retryHeaders.set("Content-Type", "application/json");

    const retryResponse = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: retryHeaders,
    });

    if (retryResponse.ok) {
      console.log(
        "[api-client] Requisição refeita com sucesso após atualizar token"
      );
      return retryResponse;
    }
  } catch (retryError) {
    console.error("[api-client] Erro ao tentar obter novo token:", retryError);
  }

  return null;
}

/**
 * Converte Timestamp do Firebase para Date
 */
function timestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === "string") {
    return new Date(timestamp);
  }
  return new Date();
}

/**
 * Extrai fotos do formData
 */
function extractPhotos(formData: Record<string, any>): ReportPhoto[] {
  const photos: ReportPhoto[] = [];
  for (const key in formData) {
    if (Array.isArray(formData[key])) {
      const fieldData = formData[key] as any[];
      if (
        fieldData.every(
          (item) => typeof item === "object" && item !== null && "url" in item
        )
      ) {
        fieldData.forEach((photo) => {
          if (photo.url && typeof photo.url === "string") {
            photos.push({
              name: photo.name || "Unnamed Photo",
              url: photo.url,
              type: photo.type || "image/unknown",
              size: photo.size || 0,
            });
          }
        });
      }
    }
  }
  return photos;
}

// ==================== API: USUÁRIOS ====================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "USER";
  isActive: boolean;
  createdAt: string;
}

/**
 * Busca dados do usuário atual (incluindo role)
 */
export async function fetchCurrentUser(): Promise<UserProfile | null> {
  if (USE_BACKEND) {
    try {
      const response = await fetchBackend("/api/v1/users/me");
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      return null;
    }
  } else {
    // Mock para Firebase-only mode
    return null;
  }
}

// ==================== API: GERENTES ====================

/**
 * Busca lista de gerentes cadastrados
 */
export async function fetchGerentes(): Promise<Gerente[]> {
  if (USE_BACKEND) {
    // Backend
    const response = await fetchBackend("/api/v1/gerentes");
    const data = await response.json();
    return data.data || data;
  } else {
    // Firebase
    const gerentesCollectionRef = collection(db, "gerentes_cadastrados");
    const q = query(gerentesCollectionRef, orderBy("nome", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      nome: docSnap.data().nome as string,
    }));
  }
}

// ==================== API: RELATÓRIOS ====================

/**
 * Busca relatórios por Ordem de Serviço
 */
export async function fetchRelatoriosByOs(
  osNumber: string
): Promise<ReportData[]> {
  if (USE_BACKEND) {
    // Backend
    const response = await fetchBackend(`/api/v1/relatorios?os=${osNumber}`);
    const data = await response.json();
    const reports = data.data || data;

    return reports.map((report: any) => ({
      ...report,
      submittedAt: Timestamp.fromDate(timestampToDate(report.submittedAt)),
      photoUrls: report.photoUrls || extractPhotos(report.formData || {}),
    }));
  } else {
    // Firebase
    const reportsSubCollectionRef = collection(
      db,
      "ordens_servico",
      osNumber,
      "relatorios"
    );
    const q = query(reportsSubCollectionRef, orderBy("submittedAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        formName: data.formName || "Nome do Formulário Indisponível",
        formType: data.formType || "unknown_form",
        submittedAt: data.submittedAt as Timestamp,
        formData: data.formData || {},
        photoUrls: extractPhotos(data.formData || {}),
      };
    });
  }
}

/**
 * Busca Ordens de Serviço por gerente
 */
export async function fetchOsByGerente(gerenteId: string): Promise<OsData[]> {
  if (USE_BACKEND) {
    // Backend
    const response = await fetchBackend(
      `/api/v1/ordens-servico?gerenteId=${gerenteId}`
    );
    const data = await response.json();
    const osList = data.data || data;

    return osList.map((os: any) => ({
      ...os,
      lastReportAt: Timestamp.fromDate(timestampToDate(os.lastReportAt)),
    }));
  } else {
    // Firebase
    const osCollectionRef = collection(db, "ordens_servico");
    const q = query(
      osCollectionRef,
      where("updatedByGerenteId", "==", gerenteId),
      orderBy("lastReportAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        os: data.os || docSnap.id,
        lastReportAt: data.lastReportAt as Timestamp,
      };
    });
  }
}

/**
 * Busca relatório individual por ID
 */
export async function fetchRelatorioById(
  osId: string,
  reportId: string
): Promise<ReportData | null> {
  if (USE_BACKEND) {
    // Backend
    const response = await fetchBackend(
      `/api/v1/relatorios/${reportId}?os=${osId}`
    );
    const data = await response.json();
    const report = data.data || data;

    return {
      ...report,
      submittedAt: timestampToDate(report.submittedAt),
    };
  } else {
    // Firebase
    const reportDocRef = doc(
      db,
      "ordens_servico",
      osId,
      "relatorios",
      reportId
    );
    const docSnap = await getDoc(reportDocRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ReportData;
    }
    return null;
  }
}

/**
 * Deleta uma foto por ID
 */
export async function deletePhoto(photoId: string): Promise<void> {
  if (!photoId) throw new Error("photoId is required");
  const response = await fetchBackend(`/api/v1/photos/${photoId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Erro" }));
    throw new Error(err.message || "Erro ao deletar foto");
  }
}

/**
 * Deleta arquivo por URL caso não exista ID de photo
 */
export async function deletePhotoByUrl(url: string): Promise<void> {
  if (!url) throw new Error("url is required");
  const encoded = encodeURIComponent(url);
  const response = await fetchBackend(`/api/v1/photos?url=${encoded}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Erro" }));
    throw new Error(err.message || "Erro ao deletar foto por URL");
  }
}

/**
 * Baixar PDF do formulário
 */
export async function downloadFormPdf(formId: string): Promise<Blob> {
  if (!formId) throw new Error("formId is required");
  const response = await fetchBackend(`/api/v1/forms/${formId}/pdf`, {
    method: "GET",
    headers: {
      Accept: "application/pdf",
    },
  });
  const blob = await response.blob();
  return blob;
}

/**
 * Atualiza formulário por ID
 */
export async function updateForm(formId: string, updates: any): Promise<any> {
  if (!formId) throw new Error("formId is required");
  const response = await fetchBackend(`/api/v1/forms/${formId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Erro" }));
    throw new Error(err.message || "Erro ao atualizar formulário");
  }
  const data = await response.json();
  return data.data || data;
}

// ==================== API: UPLOAD ====================

/**
 * Faz upload de arquivos
 */
export async function uploadFiles(
  files: FileList,
  userId: string,
  formType: string,
  osNumber: string,
  submissionTimestamp: number
): Promise<ReportPhoto[]> {
  if (USE_BACKEND) {
    // Backend - Upload via API
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    formData.append("userId", userId);
    formData.append("formType", formType);
    formData.append("osNumber", osNumber);
    formData.append("timestamp", submissionTimestamp.toString());

    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erro no upload de arquivos");
    }

    const data = await response.json();
    return data.data || data;
  } else {
    // Firebase Storage
    const uploadPromises: Promise<ReportPhoto>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `reports/${userId}/${formType}/${osNumber}/${submissionTimestamp}/${file.name}`;
      const fileStorageRef = storageRef(storage, filePath);

      const promise = new Promise<ReportPhoto>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(fileStorageRef, file);
        uploadTask.on("state_changed", null, reject, async () => {
          try {
            const url = await getDownloadURL(fileStorageRef);
            resolve({
              name: file.name,
              url,
              type: file.type,
              size: file.size,
            });
          } catch (error) {
            reject(error);
          }
        });
      });

      uploadPromises.push(promise);
    }

    return await Promise.all(uploadPromises);
  }
}

// ==================== API: SUBMISSÃO ====================

/**
 * Submete novo relatório
 */
export async function submitRelatorio(payload: {
  formType: string;
  formName: string;
  formData: Record<string, any>;
  submittedBy: string;
  submittedAt: number;
  gerenteId: string;
  originatingFormId?: string;
  osNumber?: string;
}): Promise<{ reportId: string; osId: string }> {
  if (USE_BACKEND) {
    // Backend
    const response = await fetchBackend("/api/v1/relatorios", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.data || data;
  } else {
    // Firebase
    const osNumber = payload.osNumber;

    if (!osNumber) {
      throw new Error("Ordem de Serviço é obrigatória");
    }

    // Atualizar documento da OS
    const osDocRef = doc(db, "ordens_servico", osNumber);
    await setDoc(
      osDocRef,
      {
        lastReportAt: Timestamp.fromMillis(payload.submittedAt),
        os: osNumber,
        updatedBy: payload.submittedBy,
        updatedByGerenteId: payload.gerenteId,
      },
      { merge: true }
    );

    // Adicionar relatório na subcoleção
    const reportsSubCollectionRef = collection(
      db,
      "ordens_servico",
      osNumber,
      "relatorios"
    );
    const reportPayload = {
      formType: payload.formType,
      formName: payload.formName,
      formData: payload.formData,
      submittedBy: payload.submittedBy,
      submittedAt: Timestamp.fromMillis(payload.submittedAt),
      gerenteId: payload.gerenteId,
      ...(payload.originatingFormId && {
        originatingFormId: payload.originatingFormId,
      }),
    };

    const savedDocRef = await addDoc(reportsSubCollectionRef, reportPayload);

    return {
      reportId: savedDocRef.id,
      osId: osNumber,
    };
  }
}

// ==================== API: PDF ====================

/**
 * Gera e baixa PDF de um relatório
 */
export async function downloadRelatorioPdf(
  reportId: string,
  osNumber: string
): Promise<void> {
  if (!USE_BACKEND) {
    throw new Error("Geração de PDF só está disponível com backend ativo");
  }

  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/forms/${reportId}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao gerar PDF");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-${osNumber}-${reportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ==================== API: NOTIFICAÇÕES ====================

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  link?: string;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  if (USE_BACKEND) {
    try {
      const response = await fetchBackend("/api/v1/notifications");
      const data = await response.json();
      return data.data || [];
    } catch (e) {
      console.error("Error fetching notifications", e);
      return [];
    }
  }
  return [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  if (USE_BACKEND) {
    try {
      await fetchBackend(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
      });
    } catch (e) {
      console.error("Error marking notification read", e);
    }
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  if (USE_BACKEND) {
    try {
      await fetchBackend("/api/v1/notifications/read-all", {
        method: "PATCH",
      });
    } catch (e) {
      console.error("Error marking all notifications read", e);
    }
  }
}
