import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Criar usuário Admin
  const adminEmail = 'admin@metalgalvano.com.br'
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Administrador',
      // IMPORTANTE: Este UID deve bater com o Authentication do Firebase
      // Se você já criou o usuário no Firebase, coloque o UID real aqui.
      // Se não, você precisará criar um usuário no Firebase e atualizar este registro depois.
      firebaseUid: 'admin-initial-uid', 
      role: UserRole.ADMIN,
      isActive: true,
    },
  })

  console.log(`✅ Usuário Admin criado/atualizado: ${admin.email}`)

  // Adicione outros seeds aqui se necessário (ex: configurações iniciais)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
