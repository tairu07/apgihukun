import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 管理者ユーザーを作成
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '管理者',
      role: 'ADMIN',
    },
  })

  // 運用者ユーザーを作成
  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@example.com' },
    update: {},
    create: {
      email: 'operator@example.com',
      name: '運用者',
      role: 'OPERATOR',
    },
  })

  // サンプルメンバーを作成
  const member1 = await prisma.member.upsert({
    where: { id: 'member1' },
    update: {},
    create: {
      id: 'member1',
      name: '田中太郎',
      contact: 'tanaka@example.com',
      note: 'サロン生1',
    },
  })

  const member2 = await prisma.member.upsert({
    where: { id: 'member2' },
    update: {},
    create: {
      id: 'member2',
      name: '佐藤花子',
      contact: 'sato@example.com',
      note: 'サロン生2',
    },
  })

  // サンプルデバイスを作成
  const device1 = await prisma.device.upsert({
    where: { id: 'device1' },
    update: {},
    create: {
      id: 'device1',
      name: 'iPhone 15 Pro',
      targetPrice: 159800,
    },
  })

  const device2 = await prisma.device.upsert({
    where: { id: 'device2' },
    update: {},
    create: {
      id: 'device2',
      name: 'MacBook Air M3',
      targetPrice: 164800,
    },
  })

  console.log('シードデータの作成が完了しました')
  console.log({ adminUser, operatorUser, member1, member2, device1, device2 })
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
