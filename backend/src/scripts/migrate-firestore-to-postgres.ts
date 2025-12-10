/**
 * Script de migração: Firestore → PostgreSQL
 *
 * Importa dados existentes do Firestore para o PostgreSQL
 * Execução: npx ts-node src/scripts/migrate-firestore-to-postgres.ts
 */

import { db } from "../config/firebase";
import prisma from "../config/database";
import admin from "firebase-admin";

interface FirestoreReport {
  formType: string;
  formName: string;
  formData: any;
  submittedBy: string;
  submittedAt: admin.firestore.Timestamp;
  gerenteId: string;
  originatingFormId?: string;
}

async function migrateFirestoreToPostgres() {
  console.log("🚀 Iniciando migração Firestore → PostgreSQL...\n");

  try {
    await migrateManagers();

    console.log("\n" + "-".repeat(60) + "\n");

    const stats = { total: 0, success: 0, errors: 0, oss: 0 };
    await processServiceOrders(stats);

    printSummary(stats);
  } catch (error) {
    console.error("❌ Erro fatal na migração:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function migrateManagers() {
  console.log("👥 Migrando gerentes cadastrados...\n");
  const gerentesSnapshot = await db.collection("gerentes_cadastrados").get();
  console.log(`📋 Encontrados ${gerentesSnapshot.size} gerentes\n`);

  for (const gerenteDoc of gerentesSnapshot.docs) {
    const gerenteData = gerenteDoc.data();
    const gerenteId = gerenteDoc.id;
    const gerenteEmail = `${gerenteId}@metalgalvano.forms`;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: gerenteEmail },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            firebaseUid: `gerente-${gerenteId}`,
            email: gerenteEmail,
            name: gerenteData.nome || gerenteId,
            role: gerenteEmail.includes("admin") ? "ADMIN" : "MANAGER",
          },
        });
        console.log(`✅ Gerente criado: ${gerenteData.nome || gerenteId}`);
      } else {
        console.log(`⏭️  Gerente já existe: ${gerenteData.nome || gerenteId}`);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao criar gerente ${gerenteId}:`, error.message);
    }
  }
}

async function processServiceOrders(stats: {
  total: number;
  success: number;
  errors: number;
  oss: number;
}) {
  const osSnapshot = await db.collection("ordens_servico").get();
  stats.oss = osSnapshot.size;
  console.log(`📦 Encontradas ${stats.oss} Ordens de Serviço\n`);

  for (const osDoc of osSnapshot.docs) {
    const osNumber = osDoc.id;
    const osData = osDoc.data();

    console.log(`\n📋 Processando OS: ${osNumber}`);
    console.log(`   Gerente: ${osData.updatedByGerenteId || "N/A"}`);

    const reportsSnapshot = await db
      .collection("ordens_servico")
      .doc(osNumber)
      .collection("relatorios")
      .get();

    console.log(`   📝 ${reportsSnapshot.size} relatórios encontrados`);

    for (const reportDoc of reportsSnapshot.docs) {
      stats.total++;
      await processReport(reportDoc, osNumber, stats);
    }
  }
}

async function processReport(
  reportDoc: FirebaseFirestore.QueryDocumentSnapshot,
  osNumber: string,
  stats: { success: number; errors: number }
) {
  const reportId = reportDoc.id;
  const reportData = reportDoc.data() as FirestoreReport;

  try {
    const user = await findOrCreateUser(reportData);
    if (!user) throw new Error("Falha ao vincular usuário");

    const existingForm = await prisma.form.findUnique({
      where: { id: reportId },
    });

    if (existingForm) {
      console.log(`   ⏭️  Relatório ${reportId} já existe, pulando...`);
      return;
    }

    const form = await prisma.form.create({
      data: {
        id: reportId,
        formType: reportData.formType,
        osNumber: osNumber,
        status: "SUBMITTED",
        data: reportData.formData as any,
        userId: user.id,
        submittedAt: reportData.submittedAt.toDate(),
        createdAt: reportData.submittedAt.toDate(),
      },
    });

    await migratePhotos(form.id, reportData.formData);
    stats.success++;
    console.log(`   ✅ Relatório ${reportId} migrado com sucesso`);
  } catch (error: any) {
    stats.errors++;
    console.error(`   ❌ Erro ao migrar ${reportId}:`, error.message);
  }
}

async function findOrCreateUser(reportData: FirestoreReport) {
  const gerenteEmail = `${reportData.gerenteId}@metalgalvano.forms`;
  let user = await prisma.user.findUnique({ where: { email: gerenteEmail } });

  if (!user) {
    const userName = reportData.gerenteId
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    user = await prisma.user.create({
      data: {
        firebaseUid: reportData.submittedBy || `migrated-${Date.now()}`,
        email: gerenteEmail,
        name: userName,
        role: gerenteEmail.includes("admin") ? "ADMIN" : "MANAGER",
      },
    });
    console.log(`   ✅ Usuário criado: ${userName}`);
  }
  return user;
}

async function migratePhotos(formId: string, formData: any) {
  const photos = extractPhotosFromFormData(formData);
  if (photos.length > 0) {
    for (const photo of photos) {
      await prisma.photo.create({
        data: {
          formId: formId,
          firebaseUrl: photo.url,
          firebasePath: extractPathFromUrl(photo.url),
          filename: photo.name,
          originalName: photo.name,
          mimeType: photo.type || "image/jpeg",
          size: photo.size || 0,
        },
      });
    }
    console.log(`   📷 ${photos.length} fotos migradas`);
  }
}

function printSummary(stats: {
  total: number;
  success: number;
  errors: number;
  oss: number;
}) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DA MIGRAÇÃO");
  console.log("=".repeat(60));
  console.log(`✅ Sucesso: ${stats.success}/${stats.total} relatórios`);
  console.log(`❌ Erros: ${stats.errors}/${stats.total} relatórios`);
  console.log(`📦 Total OSs processadas: ${stats.oss}`);
  console.log("=".repeat(60) + "\n");
}

// Helpers
function extractPhotosFromFormData(formData: any): any[] {
  return Object.values(formData)
    .filter((value) => Array.isArray(value))
    .flatMap((items: any[]) => items.filter(isValidPhoto));
}

function isValidPhoto(item: any): boolean {
  return (
    typeof item === "object" &&
    item !== null &&
    "url" in item &&
    typeof item.url === "string" &&
    item.url.includes("storage.googleapis.com")
  );
}

function extractPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    return pathMatch ? decodeURIComponent(pathMatch[1]) : url;
  } catch {
    return url;
  }
}

// Executar
if (require.main === module) {
  migrateFirestoreToPostgres()
    .then(() => {
      console.log("✅ Migração concluída!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migração falhou:", error);
      process.exit(1);
    });
}

export { migrateFirestoreToPostgres };
