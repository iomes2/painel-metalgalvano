import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Criar usuário admin de teste
  const admin = await prisma.user.upsert({
    where: { email: "admin@metalgalvano.com" },
    update: {},
    create: {
      firebaseUid: "firebase-admin-uid",
      email: "admin@metalgalvano.com",
      name: "Administrador",
      role: UserRole.ADMIN,
    },
  });

  console.log("✅ Usuário admin criado:", admin.email);

  // Criar usuário gerente de teste
  const manager = await prisma.user.upsert({
    where: { email: "gerente@metalgalvano.com" },
    update: {},
    create: {
      firebaseUid: "firebase-manager-uid",
      email: "gerente@metalgalvano.com",
      name: "Gerente Teste",
      role: UserRole.MANAGER,
    },
  });

  console.log("✅ Usuário gerente criado:", manager.email);

  // Criar mais gerentes de teste
  const gerentes = [
    {
      email: "joao.silva@metalgalvano.com",
      name: "João Silva",
      uid: "firebase-joao-uid",
    },
    {
      email: "maria.santos@metalgalvano.com",
      name: "Maria Santos",
      uid: "firebase-maria-uid",
    },
    {
      email: "pedro.oliveira@metalgalvano.com",
      name: "Pedro Oliveira",
      uid: "firebase-pedro-uid",
    },
  ];

  for (const gerente of gerentes) {
    await prisma.user.upsert({
      where: { email: gerente.email },
      update: {},
      create: {
        firebaseUid: gerente.uid,
        email: gerente.email,
        name: gerente.name,
        role: UserRole.MANAGER,
      },
    });
    console.log("✅ Gerente criado:", gerente.name);
  }

  // Configurações do sistema
  await prisma.systemConfig.upsert({
    where: { key: "max_photo_size_mb" },
    update: {},
    create: {
      key: "max_photo_size_mb",
      value: 10,
      description: "Tamanho máximo de foto em MB",
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "pdf_generation_enabled" },
    update: {},
    create: {
      key: "pdf_generation_enabled",
      value: true,
      description: "Habilitar geração de PDF",
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "allowed_photo_types" },
    update: {},
    create: {
      key: "allowed_photo_types",
      value: ["image/jpeg", "image/png", "image/webp"],
      description: "Tipos de arquivo permitidos para fotos",
    },
  });

  console.log("✅ Configurações do sistema criadas");
  console.log("🌱 Seed concluído!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
