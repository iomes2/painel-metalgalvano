/**
 * Script de limpeza de dados problemáticos
 * Remove formulários vazios, OSs órfãs e dependências problemáticas
 * Mantém integridade referencial e gerentes/usuários intactos
 *
 * Execução: npx ts-node src/scripts/cleanup-empty-data.ts
 */

import prisma from "../config/database";
import { storage } from "../config/firebase";
import * as readline from "readline";

interface CleanupStats {
  emptyForms: number;
  orphanedOss: number;
  orphanedPhotos: number;
  orphanedNotifications: number;
  orphanedLinkedReports: number;
  orphanedAuditLogs: number;
  photosDeletedFromStorage: number;
}

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

async function diagnosticPhase(): Promise<CleanupStats> {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 DIAGNÓSTICO DE DADOS PROBLEMÁTICOS");
  console.log("=".repeat(70) + "\n");

  const stats: CleanupStats = {
    emptyForms: 0,
    orphanedOss: 0,
    orphanedPhotos: 0,
    orphanedNotifications: 0,
    orphanedLinkedReports: 0,
    orphanedAuditLogs: 0,
    photosDeletedFromStorage: 0,
  };

  // 1️⃣ Buscar formulários vazios (data === {} ou null)
  console.log("📋 Analisando formulários...");
  const allForms = await prisma.form.findMany({
    include: { photos: true, linkedReports: true },
  });

  const emptyForms = allForms.filter((form) => {
    const data = form.data as any;
    return (
      !data ||
      Object.keys(data).length === 0 ||
      JSON.stringify(data) === "{}"
    );
  });

  stats.emptyForms = emptyForms.length;
  console.log(`   ❌ Formulários vazios encontrados: ${stats.emptyForms}`);
  
  if (stats.emptyForms > 0) {
    emptyForms.slice(0, 5).forEach((form) => {
      console.log(`      - ${form.id} (OS: ${form.osNumber}, tipo: ${form.formType})`);
    });
    if (stats.emptyForms > 5) {
      console.log(`      ... e mais ${stats.emptyForms - 5}`);
    }
  }

  // 2️⃣ Buscar OSs que não têm formulários ou só têm formulários vazios
  console.log("\n📊 Analisando Ordens de Serviço...");
  const formsGroupedByOS = allForms.reduce(
    (acc, form) => {
      if (!acc[form.osNumber]) {
        acc[form.osNumber] = [];
      }
      acc[form.osNumber].push(form);
      return acc;
    },
    {} as Record<string, typeof allForms>
  );

  let orphanedOss = 0;
  for (const [osNumber, forms] of Object.entries(formsGroupedByOS)) {
    const hasValidForm = forms.some((f) => {
      const data = f.data as any;
      return (
        data &&
        Object.keys(data).length > 0 &&
        JSON.stringify(data) !== "{}"
      );
    });

    if (!hasValidForm) {
      orphanedOss++;
      if (orphanedOss <= 5) {
        console.log(`   ⚠️  OS sem formulários válidos: ${osNumber} (${forms.length} forms vazios)`);
      }
    }
  }

  stats.orphanedOss = orphanedOss;
  console.log(`   ⚠️  OSs problemáticas: ${stats.orphanedOss}`);

  // 3️⃣ Buscar fotos órfãs (referências a formulários que serão deletados)
  console.log("\n📷 Analisando fotos...");
  stats.orphanedPhotos = emptyForms.reduce((acc, form) => {
    return acc + form.photos.length;
  }, 0);
  console.log(`   🗑️  Fotos órfãs (vinculadas a forms vazios): ${stats.orphanedPhotos}`);

  // 4️⃣ Buscar linkedReports órfãs
  console.log("\n🔗 Analisando relatórios vinculados...");
  stats.orphanedLinkedReports = emptyForms.reduce((acc, form) => {
    return acc + form.linkedReports.length;
  }, 0);
  console.log(`   🔗 Relatórios vinculados órfãos: ${stats.orphanedLinkedReports}`);

  // 5️⃣ Buscar notificações órfãs (usuários que não existem)
  console.log("\n🔔 Analisando notificações...");
  const allNotifications = await prisma.notification.findMany();
  const validUserIds = new Set((await prisma.user.findMany()).map((u) => u.id));
  const orphanedNotifications = allNotifications.filter(
    (n) => !validUserIds.has(n.userId)
  );
  stats.orphanedNotifications = orphanedNotifications.length;
  console.log(`   ❌ Notificações com usuário inválido: ${stats.orphanedNotifications}`);

  // 6️⃣ Buscar audit logs órfãos
  console.log("\n📝 Analisando logs...");
  const allAuditLogs = await prisma.auditLog.findMany();
  const orphanedAuditLogs = allAuditLogs.filter((log) => {
    if (log.entity === "Form") {
      return !allForms.some((f) => f.id === log.entityId);
    }
    return false;
  });
  stats.orphanedAuditLogs = orphanedAuditLogs.length;
  console.log(`   🗑️  Audit logs órfãos: ${stats.orphanedAuditLogs}`);

  // 7️⃣ Resumo
  console.log("\n" + "-".repeat(70));
  console.log("📊 RESUMO DO DIAGNÓSTICO:");
  console.log("-".repeat(70));
  console.log(`  Formulários vazios:           ${stats.emptyForms}`);
  console.log(`  OSs problemáticas:            ${stats.orphanedOss}`);
  console.log(`  Fotos órfãs:                  ${stats.orphanedPhotos}`);
  console.log(`  Relatórios vinculados órfãos: ${stats.orphanedLinkedReports}`);
  console.log(`  Notificações órfãs:           ${stats.orphanedNotifications}`);
  console.log(`  Audit logs órfãos:            ${stats.orphanedAuditLogs}`);
  console.log("-".repeat(70));
  console.log(
    `\n  ⚠️  Total de itens problemáticos: ${
      stats.emptyForms +
      stats.orphanedPhotos +
      stats.orphanedNotifications +
      stats.orphanedLinkedReports +
      stats.orphanedAuditLogs
    }`
  );

  return stats;
}

async function cleanupPhase(stats: CleanupStats): Promise<CleanupStats> {
  console.log("\n" + "=".repeat(70));
  console.log("🧹 LIMPEZA DE DADOS");
  console.log("=".repeat(70) + "\n");

  const confirm = await question(
    "⚠️  Deseja proceder com a limpeza? (sim/nao): "
  );

  if (confirm.toLowerCase() !== "sim") {
    console.log("\n❌ Limpeza cancelada!");
    return stats;
  }

  try {
    // 1️⃣ Deletar notificações órfãs
    if (stats.orphanedNotifications > 0) {
      console.log("\n🔔 Deletando notificações órfãs...");
      const validUserIds = new Set(
        (await prisma.user.findMany()).map((u) => u.id)
      );

      await prisma.notification.deleteMany({
        where: {
          userId: { notIn: Array.from(validUserIds) },
        },
      });
      console.log(`   ✅ ${stats.orphanedNotifications} notificações deletadas`);
    }

    // 2️⃣ Deletar fotos do storage e banco (cascade dos forms vazios)
    if (stats.orphanedPhotos > 0) {
      console.log("\n📷 Deletando fotos órfãs do Firebase Storage...");

      const emptyForms = await prisma.form.findMany({
        where: {
          data: {},
        },
        include: { photos: true },
      });

      // Agrupar fotos por path no Firebase
      const photosByPath = new Map<string, string[]>();
      for (const form of emptyForms) {
        for (const photo of form.photos) {
          if (!photosByPath.has(photo.firebasePath)) {
            photosByPath.set(photo.firebasePath, []);
          }
          photosByPath.get(photo.firebasePath)!.push(photo.id);
        }
      }

      // Deletar do Firebase Storage
      let deletedFromStorage = 0;
      for (const [path] of photosByPath) {
        try {
          await storage.bucket().file(path).delete();
          deletedFromStorage++;
        } catch (e) {
          console.warn(`   ⚠️  Não conseguiu deletar ${path} do Storage`);
        }
      }

      stats.photosDeletedFromStorage = deletedFromStorage;
      console.log(
        `   ✅ ${deletedFromStorage} fotos deletadas do Firebase Storage`
      );
    }

    // 3️⃣ Deletar formulários vazios (cascade deleta: photos, linked_reports)
    if (stats.emptyForms > 0) {
      console.log("\n📋 Deletando formulários vazios...");

      const emptyFormIds = (
        await prisma.form.findMany({
          where: {
            data: {},
          },
          select: { id: true },
        })
      ).map((f) => f.id);

      // Deletar relatórios vinculados que apontam para esses forms
      await prisma.linkedReport.deleteMany({
        where: {
          OR: [
            { parentFormId: { in: emptyFormIds } },
            { childFormId: { in: emptyFormIds } },
          ],
        },
      });

      // Deletar logs de auditoria relacionados
      await prisma.auditLog.deleteMany({
        where: {
          AND: [
            { entity: "Form" },
            { entityId: { in: emptyFormIds } },
          ],
        },
      });

      // Deletar os formulários (cascade deleta: photos)
      const deletedForms = await prisma.form.deleteMany({
        where: {
          id: { in: emptyFormIds },
        },
      });

      console.log(`   ✅ ${deletedForms.count} formulários vazios deletados`);
    }

    // Relatório final
    console.log("\n" + "=".repeat(70));
    console.log("✨ LIMPEZA CONCLUÍDA COM SUCESSO!");
    console.log("=".repeat(70));
    console.log("\n📊 Resumo da limpeza:");
    console.log(`   ✅ Formulários deletados:        ${stats.emptyForms}`);
    console.log(`   ✅ Fotos deletadas:              ${stats.orphanedPhotos}`);
    console.log(`   ✅ Fotos do Storage deletadas:   ${stats.photosDeletedFromStorage}`);
    console.log(`   ✅ Relatórios órfãos deletados: ${stats.orphanedLinkedReports}`);
    console.log(`   ✅ Notificações deletadas:       ${stats.orphanedNotifications}`);
    console.log(`   ✅ Audit logs deletados:         ${stats.orphanedAuditLogs}`);
    console.log("\n✨ Banco de dados limpo e consistente!");
    console.log("✅ Gerentes/Usuários mantidos intactos\n");

    return stats;
  } catch (error) {
    console.error("❌ Erro durante limpeza:", error);
    throw error;
  }
}

async function main() {
  console.log("\n");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(68) + "║");
  console.log("║  🧹 SCRIPT DE LIMPEZA - DADOS PROBLEMÁTICOS".padEnd(69) + "║");
  console.log("║" + " ".repeat(68) + "║");
  console.log("╚" + "═".repeat(68) + "╝");

  try {
    // Fase 1: Diagnóstico
    const stats = await diagnosticPhase();

    // Fase 2: Limpeza (com confirmação)
    await cleanupPhase(stats);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro fatal:", error);
    rl.close();
    process.exit(1);
  }
}

// Executar
main().finally(async () => {
  await prisma.$disconnect();
});
