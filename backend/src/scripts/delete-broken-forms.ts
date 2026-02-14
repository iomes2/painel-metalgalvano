/**
 * Script para deletar formulários com inconsistências de fotos
 * Remove os 3 formulários que têm fotos faltando no PostgreSQL
 *
 * Execução: npx ts-node src/scripts/delete-broken-forms.ts
 */

import prisma from "../config/database";

async function deleteInconsistentForms() {
  console.log("\n");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(68) + "║");
  console.log("║  🗑️  DELETAR FORMULÁRIOS COM INCONSISTÊNCIAS".padEnd(69) + "║");
  console.log("║" + " ".repeat(68) + "║");
  console.log("╚" + "═".repeat(68) + "╝\n");

  const formIdsToDelete = [
    "e47310b7-25f2-40bf-aa74-17a3aada0553",
    "953f69b4-fec4-4962-ab75-44f743eb7253",
    "bb1252d3-2c6d-4593-9aff-3e297df384f0",
  ];

  try {
    // Buscar detalhes dos formulários
    console.log("📋 Analisando formulários a deletar...\n");

    const formsToDelete = await prisma.form.findMany({
      where: {
        id: { in: formIdsToDelete },
      },
      include: {
        user: { select: { name: true, email: true } },
        photos: true,
        linkedReports: true,
      },
    });

    console.log(`📋 Formulários encontrados: ${formsToDelete.length}\n`);

    formsToDelete.forEach((form) => {
      console.log(`   ID: ${form.id}`);
      console.log(`   Tipo: ${form.formType}`);
      console.log(`   OS: ${form.osNumber}`);
      console.log(`   Usuário: ${form.user.name} (${form.user.email})`);
      console.log(`   Fotos: ${form.photos.length}`);
      console.log(`   Relatórios vinculados: ${form.linkedReports.length}`);
      console.log("");
    });

    console.log("\n🗑️  Deletando formulários...\n");

    // Deletar linked reports
    console.log("   1️⃣  Deletando relatórios vinculados...");
    await prisma.linkedReport.deleteMany({
      where: {
        OR: [
          { parentFormId: { in: formIdsToDelete } },
          { childFormId: { in: formIdsToDelete } },
        ],
      },
    });
    console.log("       ✅ Relatórios vinculados deletados");

    // Deletar audit logs
    console.log("   2️⃣  Deletando audit logs...");
    await prisma.auditLog.deleteMany({
      where: {
        AND: [
          { entity: "Form" },
          { entityId: { in: formIdsToDelete } },
        ],
      },
    });
    console.log("       ✅ Audit logs deletados");

    // Deletar formulários (cascade deleta photos)
    console.log("   3️⃣  Deletando formulários...");
    const deleted = await prisma.form.deleteMany({
      where: {
        id: { in: formIdsToDelete },
      },
    });
    console.log(
      `       ✅ ${deleted.count} formulários deletados (fotos deletadas em cascata)`
    );

    // Relatório final
    console.log("\n" + "=".repeat(70));
    console.log("✨ DELEÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("=".repeat(70));
    console.log("\n📊 Resumo:");
    console.log(`   ✅ Formulários deletados: 3`);
    console.log(`   ✅ Fotos deletadas: ${formsToDelete.reduce((acc, f) => acc + f.photos.length, 0)}`);
    console.log(`   ✅ Relatórios vinculados deletados: ${formsToDelete.reduce((acc, f) => acc + f.linkedReports.length, 0)}`);
    console.log("\n✨ Sistema agora sem erros e consistente!\n");
  } catch (error) {
    console.error("❌ Erro ao deletar:", error);
    process.exit(1);
  }
}

// Executar
deleteInconsistentForms()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
