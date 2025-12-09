"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Timeline } from "@/components/timeline/Timeline";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  CalendarIcon as CalendarLucideIcon,
  CheckSquare,
  Edit3,
  List,
  Hash,
  Image as ImageIcon,
  Clock,
  History,
  X,
  Printer,
  FileText as FileTextIcon,
} from "lucide-react";
import {
  getFormDefinition,
  type FormField,
  type FormFieldOption,
  type FormDefinition as FormDefinitionType,
} from "@/config/forms";
import { getFormIcon } from "@/components/icons/icon-resolver";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ImageModal from "@/components/search/ImageModal"; // Reutilizando o ImageModal
import LinkedReportModal from "@/components/reports/LinkedReportModal"; // Importando o LinkedReportModal
import { DynamicFormRenderer } from "@/components/forms/DynamicFormRenderer";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface ReportPhoto {
  id?: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ReportData {
  id: string;
  formName: string;
  formType: string;
  formData: Record<string, any>;
  submittedAt: Timestamp;
  submittedBy: string;
  gerenteId?: string;
  originatingFormId?: string;
}

const fieldTypeIcons: Record<FormField["type"], React.ElementType> = {
  text: Edit3,
  email: Edit3,
  password: Edit3,
  number: Hash,
  textarea: List,
  select: List,
  date: CalendarLucideIcon,
  file: ImageIcon,
  checkbox: CheckSquare,
};
export default function ViewReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const handleGeneratePdf = async () => {
    if (!report || !report.id) return;
    try {
      const { downloadFormPdf } = await import("@/lib/api-client");
      const blob = await downloadFormPdf(report.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${report.formType}-${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "PDF gerado", description: "Download iniciado." });
    } catch (err: any) {
      console.error("Erro ao gerar PDF:", err);
      toast({
        title: "Erro ao gerar PDF",
        description: err.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const osId = params.osId as string;
  const reportId = params.reportId as string;
  const formType = searchParams.get("formType");
  const [report, setReport] = useState<ReportData | null>(null);
  const [formDefinition, setFormDefinition] =
    useState<FormDefinitionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<ReportPhoto | null>(null);
  const [currentImageList, setCurrentImageList] = useState<ReportPhoto[]>([]);

  const [isLinkedReportModalOpen, setIsLinkedReportModalOpen] = useState(false);
  const [selectedLinkedFormType, setSelectedLinkedFormType] = useState<
    string | null
  >(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!osId || !reportId || !formType) {
      setError("Parâmetros inválidos na URL.");
      setIsLoading(false);
      return;
    }

    const definition = getFormDefinition(formType);
    if (!definition) {
      setError(
        `Definição de formulário para o tipo "${formType}" não encontrada.`
      );
      setIsLoading(false);
      return;
    }
    setFormDefinition(definition);

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Importar fetchRelatorioById do api-client
        const { fetchRelatorioById } = await import("@/lib/api-client");
        const reportData = await fetchRelatorioById(osId, reportId);

        if (reportData) {
          // Converter Timestamp para Date se necessário
          const submittedAt =
            reportData.submittedAt instanceof Date
              ? Timestamp.fromDate(reportData.submittedAt)
              : (reportData.submittedAt as Timestamp);

          setReport({
            ...reportData,
            submittedAt,
          } as ReportData);
        } else {
          setError("Relatório não encontrado.");
        }
      } catch (e: any) {
        console.error("Erro ao buscar relatório: ", e);
        setError(`Falha ao buscar relatório: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [osId, reportId, formType]);

  // Garante que a página não role; somente a coluna de respostas rola
  useEffect(() => {
    const previous = document.body.style.overflowY;
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = previous;
    };
  }, []);

  const openImageModal = (image: ReportPhoto, imageList: ReportPhoto[]) => {
    setCurrentImage(image);
    setCurrentImageList(imageList);
    setIsImageModalOpen(true);
  };

  const handleDownloadPhoto = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePhoto = async (photo: ReportPhoto) => {
    if (!photo?.id) throw new Error("ID da foto não disponível");
    try {
      const { deletePhoto, deletePhotoByUrl, fetchRelatorioById } =
        await import("@/lib/api-client");
      if (photo.id) {
        await deletePhoto(photo.id);
      } else {
        await deletePhotoByUrl(photo.url);
      }
      const updated = await fetchRelatorioById(osId, reportId);
      if (updated) {
        setReport({
          ...(updated as any),
          submittedAt: updated!.submittedAt as any,
        });
        toast({
          title: "Foto excluída",
          description: "A foto foi removida com sucesso.",
        });
      }
    } catch (err: any) {
      console.error("Erro ao deletar foto:", err);
      toast({
        title: "Erro ao excluir foto",
        description: err.message || "Erro ao deletar foto",
        variant: "destructive",
      });
    }
  };

  const openLinkedReportModal = (targetFormType: string) => {
    setSelectedLinkedFormType(targetFormType);
    setIsLinkedReportModalOpen(true);
  };

  const isImage = (file: ReportPhoto) => {
    const mime = (file.type || "").toLowerCase();
    if (mime.startsWith("image/")) return true;
    const n = (file.name || "").toLowerCase();
    return (
      n.endsWith(".jpg") ||
      n.endsWith(".jpeg") ||
      n.endsWith(".png") ||
      n.endsWith(".webp") ||
      n.endsWith(".gif")
    );
  };

  const renderFieldValue = (field: FormField, value: any) => {
    if (value === undefined || value === null || value === "") {
      return (
        <span className="italic text-muted-foreground">Não preenchido</span>
      );
    }

    switch (field.type) {
      case "date":
        // Safe parsing for date fields
        let dateVal: Date | null = null;
        try {
          const val = value as any;
          if (val instanceof Date) dateVal = val;
          else if (val && typeof val.toDate === "function")
            dateVal = val.toDate();
          else if (val && typeof val === "object") {
            if (val.seconds) dateVal = new Date(val.seconds * 1000);
            else if (val._seconds) dateVal = new Date(val._seconds * 1000);
          } else if (typeof val === "string" || typeof val === "number") {
            dateVal = new Date(val);
          }
        } catch (e) {
          console.error("Error parsing date value", value, e);
        }

        if (dateVal && !isNaN(dateVal.getTime())) {
          return format(dateVal, "dd/MM/yyyy 'às' HH:mm", {
            locale: ptBR,
          });
        }
        return String(value);
      case "checkbox":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Sim" : "Não"}
          </Badge>
        );
      case "select":
        const option = field.options?.find((opt) => opt.value === value);
        return (
          <Badge variant="outline">
            {option ? option.label : String(value)}
          </Badge>
        );
      case "file":
        if (Array.isArray(value) && value.length > 0) {
          const photos = (value as ReportPhoto[]).filter((p) => !!p && !!p.url);
          if (photos.length === 0) {
            return (
              <span className="italic text-muted-foreground">
                Nenhum arquivo
              </span>
            );
          }
          const imageFiles = photos.filter((p) => isImage(p));
          // Se houver imagens, renderiza uma grade de miniaturas clicáveis; senão, botão padrão
          if (imageFiles.length > 0) {
            return (
              <div className="flex flex-wrap gap-2 print:hidden">
                {imageFiles.slice(0, 6).map((photo, idx) => (
                  <button
                    key={`${photo.url}-${idx}`}
                    type="button"
                    className="relative h-12 w-12 overflow-hidden rounded-md ring-1 ring-border hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => openImageModal(photo, photos)}
                    aria-label={`Abrir imagem ${photo.name}`}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                ))}
                {photos.length > 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openImageModal(imageFiles[0], photos)}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />+{photos.length - 6}
                  </Button>
                )}
              </div>
            );
          }
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openImageModal(photos[0], photos)}
            >
              <ImageIcon className="mr-2 h-4 w-4" /> Ver ({photos.length})
              Arquivo(s)
            </Button>
          );
        }
        return (
          <span className="italic text-muted-foreground">Nenhum arquivo</span>
        );
      default:
        return String(value);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando relatório...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Relatório</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Alert>
      </div>
    );
  }

  if (!report || !formDefinition) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center p-4">
        <Alert className="max-w-lg">
          <AlertTitle>Relatório não encontrado</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os detalhes do relatório.
          </AlertDescription>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Alert>
      </div>
    );
  }

  const FormSpecificIcon = getFormIcon(formDefinition.iconName);

  // Coleta de todas as imagens para impressão em páginas separadas
  const allImages: ReportPhoto[] = [];
  if (formDefinition && report) {
    formDefinition.fields.forEach((f) => {
      const val = report.formData[f.id];
      if (f.type === "file" && Array.isArray(val)) {
        (val as ReportPhoto[]).forEach((p) => {
          if (p && p.url && isImage(p)) {
            allImages.push(p);
          }
        });
      }
    });
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="h-[calc(100svh-64px)] sm:h-[calc(100svh-64px-3rem)] lg:h-[calc(100svh-64px-4rem)] w-full max-w-full flex flex-col rounded-2xl border bg-gradient-to-b from-background to-muted/30 shadow-sm overflow-hidden print:block print:h-auto print:max-w-none print:rounded-none print:border-0 print:shadow-none print:bg-white">
        {/* Cabeçalho Premium - Mobile First */}
        <div className="border-b bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 dark:from-slate-800/50 dark:via-blue-900/20 dark:to-slate-800/50 relative overflow-hidden">
          {/* Accent Bar */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600" />

          {/* Header Row: Icon + Title + Buttons */}
          <div className="flex items-center gap-2 px-3 py-2 pt-3 overflow-hidden">
            {/* Icon */}
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
              <FormSpecificIcon className="h-4 w-4 text-white" />
            </div>

            {/* Title - truncated */}
            <h1 className="flex-1 text-base font-bold text-foreground min-w-0 break-words">
              {formDefinition.name}
            </h1>

            {/* Buttons - always visible */}
            <div className="flex items-center gap-1.5 flex-shrink-0 print:hidden">
              <button
                onClick={() => router.back()}
                title="Voltar"
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 transition-all active:scale-95"
              >
                <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </button>

              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 transition-all active:scale-95 cursor-pointer"
                    title="Ver Linha do Tempo"
                  >
                    <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Histórico da Obra: {osId}</DialogTitle>
                    <DialogDescription>
                      Acompanhe todas as atividades registradas para esta OS.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <Timeline osNumber={osId as string} />
                  </div>
                </DialogContent>
              </Dialog>

              {isAdmin && (
                <button
                  onClick={() => setIsEditing((v) => !v)}
                  title={isEditing ? "Cancelar" : "Editar"}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                    isEditing
                      ? "bg-amber-500 text-white"
                      : "bg-amber-100 dark:bg-amber-900/30"
                  }`}
                >
                  <Edit3
                    className={`h-4 w-4 ${
                      isEditing
                        ? "text-white"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  />
                </button>
              )}
              <button
                onClick={async () => {
                  if (!report) return;
                  try {
                    const { downloadFormPdf } = await import(
                      "@/lib/api-client"
                    );
                    const blob = await downloadFormPdf(report.id);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `relatorio-${report.formType}-${osId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    toast({ title: "PDF baixado" });
                  } catch (err: any) {
                    toast({
                      title: "Erro",
                      description: err.message,
                      variant: "destructive",
                    });
                  }
                }}
                title="Baixar PDF"
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-100 hover:bg-red-200 dark:bg-red-900/30 transition-all active:scale-95"
              >
                <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
              </button>
              <button
                onClick={() => window.print()}
                title="Imprimir"
                className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 transition-all active:scale-95"
              >
                <Printer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Meta Row: OS + Date + By */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 pb-2 text-[11px] text-muted-foreground overflow-hidden">
            <Badge className="font-mono px-1.5 py-0 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0">
              OS: {osId}
            </Badge>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              {(() => {
                if (!report.submittedAt) return "—";
                // Safe date parsing logic
                let dateVal: Date | null = null;
                const val = report.submittedAt as any;
                try {
                  if (val instanceof Date) dateVal = val;
                  else if (typeof val.toDate === "function")
                    dateVal = val.toDate();
                  else if (val.seconds) dateVal = new Date(val.seconds * 1000);
                  else if (val._seconds)
                    dateVal = new Date(val._seconds * 1000);
                  // Firebase internal
                  else dateVal = new Date(val);
                } catch (e) {
                  console.error("Date parse error", e);
                }

                return dateVal && !isNaN(dateVal.getTime())
                  ? format(dateVal, "dd/MM/yy HH:mm", { locale: ptBR })
                  : "—";
              })()}
            </span>
            {report.submittedBy && (
              <span className="hidden sm:inline">
                •{" "}
                <span className="font-medium text-foreground">
                  {report.submittedBy}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Corpo em Grid: Metadados (col-esq) + Campos (col-dir) */}
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 md:p-4 h-full overflow-x-hidden min-w-0 w-full max-w-full">
            {/* Sidebar de Metadados - Premium */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 print:hidden">
              <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
                {/* Sidebar Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-slate-100 to-blue-50/50 dark:from-slate-800 dark:to-blue-900/20 border-b">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Resumo do Relatório
                  </h3>
                </div>

                <div className="p-4 space-y-3 text-sm">
                  {/* ID Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">
                      ID
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] max-w-[65%] truncate"
                    >
                      {report.id}
                    </Badge>
                  </div>

                  {/* Gerente */}
                  {report.gerenteId && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs uppercase tracking-wide">
                        Gerente
                      </span>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0 text-xs">
                        {report.gerenteId}
                      </Badge>
                    </div>
                  )}

                  {/* Formulário */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">
                      Tipo
                    </span>
                    <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0 text-xs max-w-[65%] truncate">
                      {formDefinition.name}
                    </Badge>
                  </div>

                  {/* Divider */}
                  <div className="border-t my-2" />

                  {/* Data/Hora */}
                  <div className="flex items-center gap-2 text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                    <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs">
                      {(() => {
                        if (!report.submittedAt) return "Data inválida";
                        let dateVal: Date | null = null;
                        const val = report.submittedAt as any;
                        try {
                          if (val instanceof Date) dateVal = val;
                          else if (typeof val.toDate === "function")
                            dateVal = val.toDate();
                          else if (val.seconds)
                            dateVal = new Date(val.seconds * 1000);
                          else if (val._seconds)
                            dateVal = new Date(val._seconds * 1000);
                          else dateVal = new Date(val);
                        } catch (e) {
                          console.error("Sidebar date parse error", e);
                        }

                        return dateVal && !isNaN(dateVal.getTime())
                          ? format(
                              dateVal,
                              "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )
                          : "Data inválida";
                      })()}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t bg-slate-50/50 dark:bg-slate-800/30">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-sm"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                </div>
              </div>
            </aside>

            {/* Conteúdo: Campos do formulário - rolável */}
            <section className="lg:col-span-8 xl:col-span-9 h-full overflow-y-auto overflow-x-hidden overscroll-contain pr-1 min-w-0 print:overflow-visible print:h-auto print-reset-overflow">
              {isEditing && report && (
                <div className="mb-4">
                  <DynamicFormRenderer
                    formDefinition={formDefinition}
                    initialValues={report.formData}
                    onSubmit={async (payload) => {
                      // call updateForm
                      try {
                        const { updateForm } = await import("@/lib/api-client");
                        await updateForm(report.id, {
                          data: payload.formData,
                          formType: payload.formType,
                        });
                        toast({
                          title: "Formulário atualizado",
                          description: "As alterações foram salvas.",
                        });
                        // Reload report
                        const { fetchRelatorioById } = await import(
                          "@/lib/api-client"
                        );
                        const updated = await fetchRelatorioById(
                          osId,
                          reportId
                        );
                        setReport({
                          ...(updated as any),
                          submittedAt: updated!.submittedAt as any,
                        });
                        setIsEditing(false);
                      } catch (err: any) {
                        toast({
                          title: "Erro ao atualizar",
                          description: err.message || "Falha",
                          variant: "destructive",
                        });
                        console.error(err);
                        throw err;
                      }
                    }}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 pb-3 min-w-0 w-full max-w-full">
                {!isEditing &&
                  formDefinition.fields.map((field) => {
                    const fieldValue = report.formData[field.id];

                    let shouldRenderField = true;
                    if (formDefinition.id === "cronograma-diario-obra") {
                      if (field.id === "motivoAtrasoDia")
                        shouldRenderField =
                          report.formData["situacaoEtapaDia"] === "em_atraso";
                      else if (field.id === "uploadFotosEtapaDia")
                        shouldRenderField =
                          report.formData["fotosEtapaDia"] === "sim";
                      else if (field.id === "motivoRetrabalhoParadaDia")
                        shouldRenderField =
                          !!report.formData["horasRetrabalhoParadasDia"] &&
                          String(
                            report.formData["horasRetrabalhoParadasDia"]
                          ).trim() !== "";
                      else if (
                        field.id === "motivoNaoCumprimentoHorarioInicio"
                      ) {
                        const efetivo = String(
                          report.formData["horarioEfetivoInicioAtividades"] ||
                            ""
                        ).trim();
                        const previsto = String(
                          report.formData["horarioInicioJornadaPrevisto"] || ""
                        ).trim();
                        shouldRenderField =
                          efetivo !== "" && efetivo !== previsto;
                      } else if (
                        field.id === "motivoNaoCumprimentoHorarioSaida"
                      ) {
                        const efetivo = String(
                          report.formData["horarioEfetivoSaidaObra"] || ""
                        ).trim();
                        const previsto = String(
                          report.formData["horarioTerminoJornadaPrevisto"] || ""
                        ).trim();
                        shouldRenderField =
                          efetivo !== "" && efetivo !== previsto;
                      }
                    } else if (formDefinition.id === "rnc-report") {
                      if (field.id === "uploadFotosNaoConformidade")
                        shouldRenderField =
                          report.formData["fotosNaoConformidade"] === "sim";
                    } else if (
                      formDefinition.id === "relatorio-inspecao-site"
                    ) {
                      if (field.id === "uploadFotosInspecao")
                        shouldRenderField =
                          report.formData["fotosInspecao"] === "sim";
                      if (
                        field.id === "itensNaoConformes" ||
                        field.id === "acoesCorretivasSugeridas"
                      ) {
                        shouldRenderField =
                          report.formData["conformidadeSeguranca"] === "nao";
                      }
                    }

                    if (
                      !shouldRenderField &&
                      (fieldValue === undefined ||
                        fieldValue === null ||
                        fieldValue === "" ||
                        (Array.isArray(fieldValue) && fieldValue.length === 0))
                    ) {
                      return null;
                    }

                    const FieldIcon = fieldTypeIcons[field.type] || FileText;

                    const isLargeField =
                      field.type === "textarea" || field.type === "file";

                    // Color based on field type
                    const getFieldHeaderColor = (type: FormField["type"]) => {
                      switch (type) {
                        case "date":
                          return "from-amber-100 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 text-amber-700 dark:text-amber-300";
                        case "checkbox":
                          return "from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 text-green-700 dark:text-green-300";
                        case "select":
                          return "from-slate-100 to-gray-50 dark:from-slate-800 dark:to-gray-900/50 text-slate-700 dark:text-slate-300";
                        case "file":
                          return "from-zinc-100 to-stone-50 dark:from-zinc-900/30 dark:to-stone-900/20 text-zinc-700 dark:text-zinc-300";
                        case "textarea":
                          return "from-cyan-100 to-teal-50 dark:from-cyan-900/30 dark:to-teal-900/20 text-cyan-700 dark:text-cyan-300";
                        case "number":
                          return "from-sky-100 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/20 text-sky-700 dark:text-sky-300";
                        default:
                          return "from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/50 text-slate-700 dark:text-slate-300";
                      }
                    };

                    return (
                      <div
                        key={field.id}
                        className={`rounded-xl border border-slate-200/80 dark:border-slate-700/50 bg-card shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden min-w-0 print-avoid-break-inside ${
                          isLargeField ? "sm:col-span-2 xl:col-span-3" : ""
                        }`}
                      >
                        {/* Título do campo com cor */}
                        <div
                          className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${getFieldHeaderColor(
                            field.type
                          )}`}
                        >
                          <FieldIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <h3
                            className="text-xs font-semibold leading-5 truncate"
                            title={field.label}
                          >
                            {field.label}
                          </h3>
                        </div>
                        {/* Valor */}
                        <div className="px-3 py-2.5 text-sm leading-relaxed break-words break-all whitespace-pre-wrap min-w-0 max-w-full bg-white dark:bg-slate-900/50">
                          {renderFieldValue(field, fieldValue)}
                          {field.linkedForm &&
                            fieldValue === field.linkedForm.conditionValue && (
                              <div className="mt-3 pt-2 border-t border-dashed">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full sm:w-auto whitespace-normal break-words text-xs leading-tight text-center max-w-full border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                  onClick={() =>
                                    openLinkedReportModal(
                                      field.linkedForm!.targetFormType
                                    )
                                  }
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  {field.linkedForm.linkButtonLabel}
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {currentImage && currentImageList.length > 0 && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          image={currentImage}
          imageList={currentImageList}
          onDownload={handleDownloadPhoto}
          onNavigate={(nextImage) => setCurrentImage(nextImage)}
          onDelete={handleDeletePhoto}
          canDelete={user?.email?.split("@")[0] === report?.gerenteId}
        />
      )}

      {selectedLinkedFormType && (
        <LinkedReportModal
          isOpen={isLinkedReportModalOpen}
          onClose={() => {
            setIsLinkedReportModalOpen(false);
            setSelectedLinkedFormType(null);
          }}
          osId={osId}
          targetFormType={selectedLinkedFormType}
          mainReportSubmittedAt={report.submittedAt}
        />
      )}
      {/* Seção somente para impressão com cada imagem em página própria */}
      {allImages.length > 0 && (
        <div className="hidden print:block print-images-section">
          {allImages.map((img, idx) => (
            <div key={img.url + idx} className="print-image-page">
              <img
                src={img.url}
                alt={img.name}
                className="max-w-full h-auto mx-auto"
              />
              <div className="mt-2 text-center text-xs text-muted-foreground">
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
