/**
 * Script para diagnosticar e corrigir fotos migradas do Firestore
 * Verifica se as imagens estão vinculadas corretamente aos formulários
 *
 * Execução: npx ts-node src/scripts/fix-photos-migration.ts
 */

import prisma from "../config/database";

async function fixPhotosFromMigration() {
  console.log("🔍 Analisando fotos migradas...\n");

  try {
    // 1. Listar todas as fotos no banco
    const photos = await prisma.photo.findMany({
      include: { form: true },
    });

    console.log(`📊 Total de fotos no banco: ${photos.length}\n`);

    let validPhotos = 0;
    let invalidUrls = 0;
    let missingForms = 0;
    let relinked = 0;

    // 2. Verificar cada foto
    for (const photo of photos) {
      // Verificar se a URL é válida
      if (!isValidFirebaseStorageUrl(photo.firebaseUrl)) {
        console.log(`❌ URL inválida: ${photo.firebaseUrl}`);
        invalidUrls++;
        continue;
      }

      // Verificar se o formulário existe
      if (!photo.form) {
        console.log(`⚠️  Foto orfã (sem formulário): ${photo.id}`);
        missingForms++;

        // Tentar encontrar o formulário correto pelo Firestore
        const foundFormId = await findCorrectFormIdInFirestore(
          photo.firebasePath,
        );
        if (foundFormId && foundFormId !== photo.formId) {
          await prisma.photo.update({
            where: { id: photo.id },
            data: { formId: foundFormId },
          });
          console.log(`   ✅ Revinculada ao formulário: ${foundFormId}`);
          relinked++;
        }
        continue;
      }

      validPhotos++;
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 DIAGNÓSTICO");
    console.log("=".repeat(60));
    console.log(`✅ Fotos válidas: ${validPhotos}`);
    console.log(`❌ URLs inválidas: ${invalidUrls}`);
    console.log(`⚠️  Fotos orfãs: ${missingForms}`);
    console.log(`🔗 Revinculadas: ${relinked}`);
    console.log("=".repeat(60) + "\n");

    // 3. Se houver problemas, oferecer opção de reconstruir
    if (invalidUrls > 0 || missingForms > relinked) {
      console.log("⚠️  Algumas fotos podem estar corrompidas na migração.");
      console.log("Considere rodar a migração novamente com:");
      console.log(
        "npx ts-node src/scripts/migrate-firestore-to-postgres.ts --fix-photos\n",
      );
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro durante diagnóstico:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

/**
 * Verifica se a URL é uma URL válida do Firebase Storage
 */
function isValidFirebaseStorageUrl(url: string): boolean {
  return (
    typeof url === "string" &&
    url.length > 0 &&
    (url.includes("storage.googleapis.com") ||
      url.includes("firebasestorage.googleapis.com"))
  );
}

/**
 * Tenta encontrar o formulário correto no Firestore baseado no caminho da imagem
 */
async function findCorrectFormIdInFirestore(
  imagePath: string,
): Promise<string | null> {
  try {
    // O imagePath geralmente é: "ordens_servico/{osNumber}/relatorios/{formId}/images/..."
    const match = imagePath.match(/relatorios\/([^/]+)\//);
    if (match && match[1]) {
      // Verificar se esse formId existe no banco
      const form = await prisma.form.findUnique({
        where: { id: match[1] },
      });
      return form ? form.id : null;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar formulário:", error);
    return null;
  }
}

// Executar
if (require.main === module) {
  fixPhotosFromMigration();
}

export { fixPhotosFromMigration };
