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
    // 0. Migrar gerentes cadastrados primeiro
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
          console.log(
            `⏭️  Gerente já existe: ${gerenteData.nome || gerenteId}`
          );
        }
      } catch (error: any) {
        console.error(`❌ Erro ao criar gerente ${gerenteId}:`, error.message);
      }
    }

    console.log("\n" + "-".repeat(60) + "\n");

    // 1. Buscar todas as Ordens de Serviço
    const osSnapshot = await db.collection("ordens_servico").get();
    console.log(`📦 Encontradas ${osSnapshot.size} Ordens de Serviço\n`);

    let totalReports = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const osDoc of osSnapshot.docs) {
      const osNumber = osDoc.id;
      const osData = osDoc.data();

      console.log(`\n📋 Processando OS: ${osNumber}`);
      console.log(`   Gerente: ${osData.updatedByGerenteId || "N/A"}`);

      // 2. Buscar relatórios desta OS
      const reportsSnapshot = await db
        .collection("ordens_servico")
        .doc(osNumber)
        .collection("relatorios")
        .get();

      console.log(`   📝 ${reportsSnapshot.size} relatórios encontrados`);

      for (const reportDoc of reportsSnapshot.docs) {
        totalReports++;
        const reportData = reportDoc.data() as FirestoreReport;
        const reportId = reportDoc.id;

        try {
          // 3. Buscar ou criar usuário
          const gerenteEmail = `${reportData.gerenteId}@metalgalvano.forms`;
          let user = await prisma.user.findUnique({
            where: { email: gerenteEmail },
          });

          if (!user) {
            // Criar usuário se não existir
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

          // 4. Verificar se relatório já existe (evitar duplicatas)
          const existingForm = await prisma.form.findUnique({
            where: { id: reportId },
          });

          if (existingForm) {
            console.log(`   ⏭️  Relatório ${reportId} já existe, pulando...`);
            continue;
          }

          // 5. Criar formulário no PostgreSQL
          const form = await prisma.form.create({
            data: {
              id: reportId, // Manter mesmo ID do Firestore
              formType: reportData.formType,
              osNumber: osNumber,
              status: "SUBMITTED",
              data: reportData.formData as any,
              userId: user.id,
              submittedAt: reportData.submittedAt.toDate(),
              createdAt: reportData.submittedAt.toDate(),
            },
          });

          // 6. Migrar fotos (se houver)
          const photos = extractPhotosFromFormData(reportData.formData);
          if (photos.length > 0) {
            for (const photo of photos) {
              await prisma.photo.create({
                data: {
                  formId: form.id,
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

          successCount++;
          console.log(`   ✅ Relatório ${reportId} migrado com sucesso`);
        } catch (error: any) {
          errorCount++;
          console.error(`   ❌ Erro ao migrar ${reportId}:`, error.message);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA MIGRAÇÃO");
    console.log("=".repeat(60));
    console.log(`✅ Sucesso: ${successCount}/${totalReports} relatórios`);
    console.log(`❌ Erros: ${errorCount}/${totalReports} relatórios`);
    console.log(`📦 Total OSs processadas: ${osSnapshot.size}`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Erro fatal na migração:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helpers
function extractPhotosFromFormData(formData: any): any[] {
  const photos: any[] = [];

  for (const key in formData) {
    const value = formData[key];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "url" in item &&
          typeof item.url === "string" &&
          item.url.includes("storage.googleapis.com")
        ) {
          photos.push(item);
        }
      });
    }
  }

  return photos;
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
