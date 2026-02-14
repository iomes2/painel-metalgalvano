/**
 * Script de auditoria: Comparação Firestore ↔ PostgreSQL
 * Identifica dados que estão no Firebase mas não foram migrados corretamente
 *
 * Execução: npx ts-node src/scripts/audit-firestore-vs-postgres.ts
 */

import prisma from "../config/database";
import { db } from "../config/firebase";
import admin from "firebase-admin";

interface FirebaseOS {
  osNumber: string;
  reports: FirebaseReport[];
}

interface FirebaseReport {
  id: string;
  formType: string;
  formName?: string;
  formData?: any;
  submittedBy?: string;
  submittedAt?: admin.firestore.Timestamp;
  gerenteId?: string;
  isEmpty: boolean;
  dataSize: number;
}

interface AuditResult {
  osInFirebaseOnly: FirebaseOS[];
  formsInFirebaseOnly: FirebaseReport[];
  emptyInBothPlaces: FirebaseReport[];
  emptyOnlyInPostgres: FirebaseReport[];
  dataConsistencyIssues: string[];
}

async function auditFirestoreVsPostgres() {
  console.log("\n");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(68) + "║");
  console.log("║  🔍 AUDITORIA: FIRESTORE ↔ POSTGRESQL".padEnd(69) + "║");
  console.log("║" + " ".repeat(68) + "║");
  console.log("╚" + "═".repeat(68) + "╝\n");

  const result: AuditResult = {
    osInFirebaseOnly: [],
    formsInFirebaseOnly: [],
    emptyInBothPlaces: [],
    emptyOnlyInPostgres: [],
    dataConsistencyIssues: [],
  };

  try {
    // 1️⃣ Buscar dados do Firestore
    console.log("📂 Buscando Ordens de Serviço no Firestore...\n");

    const osSnapshot = await db.collection("ordens_servico").get();
    console.log(`   📋 ${osSnapshot.size} OSs encontradas no Firestore`);

    const postgresOss = await prisma.form.findMany({
      select: { osNumber: true },
      distinct: ["osNumber"],
    });

    const postgresOssSet = new Set(postgresOss.map((o) => o.osNumber));

    // 2️⃣ Analisar cada OS
    console.log("\n🔎 Analisando cada OS...\n");

    let osCount = 0;
    let reportCount = 0;
    let emptyFirebaseCount = 0;

    for (const osDoc of osSnapshot.docs) {
      const osNumber = osDoc.id;

      // Verificar se existe no Postgres
      if (!postgresOssSet.has(osNumber)) {
        console.log(`   ⚠️  OS ${osNumber} existe no Firebase mas NÃO no PostgreSQL`);
        osCount++;
      }

      // Buscar relatórios dessa OS no Firestore
      const reportsSnapshot = await db
        .collection("ordens_servico")
        .doc(osNumber)
        .collection("relatorios")
        .get();

      console.log(`      📄 ${reportsSnapshot.size} relatórios encontrados`);

      for (const reportDoc of reportsSnapshot.docs) {
        const reportId = reportDoc.id;
        const reportData = reportDoc.data();

        reportCount++;

        // Verificar se o formulário está vazio no Firebase
        const isFirebaseEmpty =
          !reportData.formData ||
          Object.keys(reportData.formData).length === 0 ||
          JSON.stringify(reportData.formData) === "{}";

        // Buscar no Postgres
        const postgresForm = await prisma.form.findUnique({
          where: { id: reportId },
          include: { photos: true },
        });

        const isPostgresEmpty =
          !postgresForm?.data ||
          Object.keys(postgresForm.data).length === 0 ||
          JSON.stringify(postgresForm.data) === "{}";

        // Analisar casos
        if (!postgresForm) {
          // ❌ Só existe no Firebase
          result.formsInFirebaseOnly.push({
            id: reportId,
            formType: reportData.formType,
            formName: reportData.formName,
            isEmpty: isFirebaseEmpty,
            dataSize: JSON.stringify(reportData.formData).length,
          });

          console.log(
            `      ❌ Relatório ${reportId.substring(0, 8)}... ${
              isFirebaseEmpty ? "VAZIO" : "COM DADOS"
            } - NÃO está no PostgreSQL`
          );
        } else if (isFirebaseEmpty && isPostgresEmpty) {
          // ⚠️ Vazio em ambos
          result.emptyInBothPlaces.push({
            id: reportId,
            formType: reportData.formType,
            isEmpty: true,
            dataSize: 0,
          });

          console.log(
            `      ⚠️  Relatório ${reportId.substring(0, 8)}... VAZIO em ambos`
          );
          emptyFirebaseCount++;
        } else if (isFirebaseEmpty && !isPostgresEmpty) {
          // 🔄 Vazio no Firebase mas tem dados no Postgres
          result.emptyOnlyInPostgres.push({
            id: reportId,
            formType: reportData.formType,
            isEmpty: true,
            dataSize: 0,
          });

          console.log(
            `      🔄 Relatório ${reportId.substring(0, 8)}... VAZIO no Firebase mas com dados no PostgreSQL`
          );
        } else if (!isFirebaseEmpty && isPostgresEmpty) {
          // 📥 Com dados no Firebase mas vazio no Postgres
          const dataSize = JSON.stringify(reportData.formData).length;
          result.dataConsistencyIssues.push(
            `Formulário ${reportId}: ${dataSize} bytes no Firebase mas vazio no Postgres`
          );

          console.log(
            `      📥 Relatório ${reportId.substring(0, 8)}... ${dataSize}B no Firebase mas VAZIO no PostgreSQL`
          );
        } else {
          // ✅ Ambos têm dados
          if (postgresForm.photos.length === 0 && reportData.formData) {
            const photoCount = (Object.values(reportData.formData) as any[])
              .filter(Array.isArray)
              .reduce((acc, arr) => acc + arr.length, 0);

            if (photoCount > 0) {
              result.dataConsistencyIssues.push(
                `Formulário ${reportId}: Tem fotos no Firebase (${photoCount}) mas não no PostgreSQL`
              );

              console.log(
                `      📷 Relatório ${reportId.substring(0, 8)}... tem fotos no Firebase (${photoCount}) mas não no Postgres`
              );
            }
          }
        }
      }
    }

    // 3️⃣ Relatório final
    console.log("\n" + "=".repeat(70));
    console.log("📊 RELATÓRIO DE AUDITORIA");
    console.log("=".repeat(70) + "\n");

    console.log("📈 ESTATÍSTICAS GERAIS:");
    console.log(`   Total OSs no Firestore:           ${osSnapshot.size}`);
    console.log(`   Total OSs no PostgreSQL:          ${postgresOssSet.size}`);
    console.log(`   OSs faltando no PostgreSQL:       ${osCount}\n`);

    console.log(
      `   Total relatórios analisados:      ${reportCount}`
    );
    console.log(
      `   Relatórios vazios em ambos:       ${result.emptyInBothPlaces.length}`
    );
    console.log(
      `   Relatórios com dados só no Postgres: ${result.emptyOnlyInPostgres.length}`
    );
    console.log(
      `   Relatórios faltando no Postgres: ${result.formsInFirebaseOnly.length}\n`
    );

    // 4️⃣ Detalhes de inconsistências
    if (result.formsInFirebaseOnly.length > 0) {
      console.log("❌ FORMULÁRIOS QUE ESTÃO NO FIREBASE MAS NÃO NO POSTGRESQL:");
      console.log("-".repeat(70));

      result.formsInFirebaseOnly.slice(0, 10).forEach((form) => {
        console.log(
          `   📄 ${form.id}`
        );
        console.log(
          `      Tipo: ${form.formType} | Tamanho: ${form.dataSize} bytes | ${
            form.isEmpty ? "VAZIO" : "COM DADOS"
          }`
        );
      });

      if (result.formsInFirebaseOnly.length > 10) {
        console.log(
          `   ... e mais ${result.formsInFirebaseOnly.length - 10}`
        );
      }
      console.log("");
    }

    if (result.emptyInBothPlaces.length > 0) {
      console.log("⚠️  FORMULÁRIOS VAZIOS EM AMBOS OS LUGARES:");
      console.log("-".repeat(70));

      result.emptyInBothPlaces.slice(0, 10).forEach((form) => {
        console.log(`   ⚠️  ${form.id} (${form.formType})`);
      });

      if (result.emptyInBothPlaces.length > 10) {
        console.log(
          `   ... e mais ${result.emptyInBothPlaces.length - 10}`
        );
      }
      console.log("");
    }

    if (result.dataConsistencyIssues.length > 0) {
      console.log("🔄 INCONSISTÊNCIAS DE DADOS:");
      console.log("-".repeat(70));

      result.dataConsistencyIssues.slice(0, 10).forEach((issue) => {
        console.log(`   ${issue}`);
      });

      if (result.dataConsistencyIssues.length > 10) {
        console.log(
          `   ... e mais ${result.dataConsistencyIssues.length - 10}`
        );
      }
      console.log("");
    }

    // 5️⃣ Recomendações
    console.log("💡 RECOMENDAÇÕES:");
    console.log("-".repeat(70));

    if (result.formsInFirebaseOnly.length > 0) {
      console.log(
        `   1️⃣  Existem ${result.formsInFirebaseOnly.length} formulários no Firebase que faltam no Postgres`
      );
      console.log("      → Usar script 'migrate-firestore-to-postgres.ts' para re-migrar");
      console.log("");
    }

    if (result.emptyInBothPlaces.length > 0) {
      console.log(
        `   2️⃣  Existem ${result.emptyInBothPlaces.length} formulários vazios em ambos`
      );
      console.log("      → Use 'cleanup-empty-data.ts' para deletar esses formulários vazios");
      console.log("");
    }

    if (result.dataConsistencyIssues.length > 0) {
      console.log(
        `   3️⃣  Existem ${result.dataConsistencyIssues.length} inconsistências de dados`
      );
      console.log(
        "      → Revisar e sincronizar manualmente ou re-migrar formulários específicos"
      );
      console.log("");
    }

    console.log("=".repeat(70) + "\n");

    // Salvar relatório em arquivo
    const reportFileName = `auditoria-${new Date().toISOString().split("T")[0]}.json`;
    const fs = require("fs");
    fs.writeFileSync(
      reportFileName,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: {
            osInFirebaseOnly: result.osInFirebaseOnly.length,
            formsInFirebaseOnly: result.formsInFirebaseOnly.length,
            emptyInBothPlaces: result.emptyInBothPlaces.length,
            emptyOnlyInPostgres: result.emptyOnlyInPostgres.length,
            dataConsistencyIssues: result.dataConsistencyIssues.length,
          },
          details: result,
        },
        null,
        2
      )
    );

    console.log(`📄 Relatório salvo em: ${reportFileName}`);
  } catch (error) {
    console.error("❌ Erro durante auditoria:", error);
    throw error;
  }
}

// Executar
auditFirestoreVsPostgres()
  .then(() => {
    console.log("✅ Auditoria concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
