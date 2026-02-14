/**
 * Script para re-migrar formulários específicos do Firebase
 * Útil quando alguns formulários não foram migrados corretamente
 *
 * Execução: npx ts-node src/scripts/remigrate-specific-forms.ts
 */

import prisma from "../config/database";
import { db, storage } from "../config/firebase";
import admin from "firebase-admin";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

interface MigrationStats {
  total: number;
  success: number;
  errors: number;
  photosCreated: number;
}

async function remigrateSpecificForms() {
  console.log("\n");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(68) + "║");
  console.log("║  🔄 RE-MIGRAÇÃO DE FORMULÁRIOS ESPECÍFICOS".padEnd(69) + "║");
  console.log("║" + " ".repeat(68) + "║");
  console.log("╚" + "═".repeat(68) + "╝\n");

  try {
    // 1️⃣ Buscar OSs e relatórios do Firestore que faltam no Postgres
    console.log("📂 Buscando formulários faltando no PostgreSQL...\n");

    const osSnapshot = await db.collection("ordens_servico").get();
    const postgresFormIds = new Set(
      (await prisma.form.findMany({ select: { id: true } })).map((f) => f.id)
    );

    const formsToMigrate: {
      osNumber: string;
      reportId: string;
      data: any;
    }[] = [];

    for (const osDoc of osSnapshot.docs) {
      const osNumber = osDoc.id;
      const reportsSnapshot = await db
        .collection("ordens_servico")
        .doc(osNumber)
        .collection("relatorios")
        .get();

      for (const reportDoc of reportsSnapshot.docs) {
        const reportId = reportDoc.id;
        const reportData = reportDoc.data();

        // Se não existe no Postgres, adicionar à lista
        if (!postgresFormIds.has(reportId)) {
          // Só migrar se tiver dados
          if (
            reportData.formData &&
            Object.keys(reportData.formData).length > 0
          ) {
            formsToMigrate.push({
              osNumber,
              reportId,
              data: reportData,
            });
          }
        }
      }
    }

    console.log(
      `📋 Encontrados ${formsToMigrate.length} formulários para re-migrar\n`
    );

    if (formsToMigrate.length === 0) {
      console.log("✅ Nenhum formulário faltando no PostgreSQL!");
      rl.close();
      return;
    }

    // 2️⃣ Mostrar preview
    console.log("📊 FORMULÁRIOS A MIGRAR:");
    console.log("-".repeat(70));
    formsToMigrate.slice(0, 10).forEach((form, idx) => {
      const dataSize = JSON.stringify(form.data.formData).length;
      console.log(
        `   ${idx + 1}. ${form.reportId.substring(0, 8)}... (OS: ${
          form.osNumber
        }, ${dataSize} bytes)`
      );
    });

    if (formsToMigrate.length > 10) {
      console.log(`   ... e mais ${formsToMigrate.length - 10}`);
    }

    // 3️⃣ Confirmar
    const confirmMigrate = await question(
      `\n🔄 Re-migrar esses ${formsToMigrate.length} formulários? (sim/nao): `
    );

    if (confirmMigrate.toLowerCase() !== "sim") {
      console.log("\n❌ Re-migração cancelada!");
      rl.close();
      return;
    }

    // 4️⃣ Executar migração
    console.log("\n🔄 Iniciando re-migração...\n");

    const stats: MigrationStats = {
      total: formsToMigrate.length,
      success: 0,
      errors: 0,
      photosCreated: 0,
    };

    for (let i = 0; i < formsToMigrate.length; i++) {
      const { osNumber, reportId, data } = formsToMigrate[i];

      try {
        // Encontrar ou criar usuário
        const gerenteEmail = `${data.gerenteId || "unknown"}@metalgalvano.forms`;
        let user = await prisma.user.findUnique({ where: { email: gerenteEmail } });

        if (!user) {
          const userName = (data.gerenteId || "Unknown")
            .split(".")
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

          user = await prisma.user.create({
            data: {
              firebaseUid: data.submittedBy || `migrated-${Date.now()}`,
              email: gerenteEmail,
              name: userName,
              role: gerenteEmail.includes("admin") ? "ADMIN" : "MANAGER",
            },
          });
          console.log(`   👤 Usuário criado: ${userName}`);
        }

        // Criar formulário
        const form = await prisma.form.create({
          data: {
            id: reportId,
            formType: data.formType,
            osNumber: osNumber,
            status: "SUBMITTED",
            data: data.formData as any,
            userId: user.id,
            submittedAt: data.submittedAt
              ? data.submittedAt.toDate()
              : new Date(),
          },
        });

        // Migrar fotos
        const photos = extractPhotosFromFormData(data.formData);
        for (const photo of photos) {
          try {
            await prisma.photo.create({
              data: {
                formId: reportId,
                firebaseUrl: photo.url,
                firebasePath: extractPathFromUrl(photo.url),
                filename: photo.name,
                originalName: photo.name,
                mimeType: photo.type || "image/jpeg",
                size: photo.size || 0,
              },
            });
            stats.photosCreated++;
          } catch (photoError) {
            console.warn(`      ⚠️  Erro ao criar foto ${photo.name}`);
          }
        }

        stats.success++;
        const progress = ((i + 1) / formsToMigrate.length) * 100;
        console.log(
          `   ✅ [${progress.toFixed(1)}%] ${reportId.substring(0, 8)}... migrado`
        );
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Erro ao migrar ${reportId}:`, error);
      }
    }

    // 5️⃣ Relatório final
    console.log("\n" + "=".repeat(70));
    console.log("✨ RE-MIGRAÇÃO CONCLUÍDA");
    console.log("=".repeat(70) + "\n");
    console.log("📊 Resumo:");
    console.log(`   ✅ Sucesso: ${stats.success}/${stats.total}`);
    console.log(`   ❌ Erros: ${stats.errors}`);
    console.log(`   📷 Fotos criadas: ${stats.photosCreated}\n`);

    rl.close();
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    rl.close();
    process.exit(1);
  }
}

function extractPhotosFromFormData(formData: any): any[] {
  return Object.values(formData)
    .filter((value) => Array.isArray(value))
    .flatMap((items: any[]) =>
      items.filter(
        (item) =>
          item &&
          typeof item === "object" &&
          (item.url ||
            item.firebaseUrl ||
            item.path ||
            item.firebasePath)
      )
    );
}

function extractPathFromUrl(url: string): string {
  try {
    const match = url.match(
      /\/o\/(.*?)[?#]/
    );
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return url;
  } catch {
    return url;
  }
}

// Executar
remigrateSpecificForms()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
