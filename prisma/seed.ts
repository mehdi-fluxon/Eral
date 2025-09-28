import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const erad = await prisma.teamMember.upsert({
    where: { email: 'erad@example.com' },
    update: {},
    create: {
      name: 'Erad',
      email: 'erad@example.com'
    }
  })

  const karl = await prisma.teamMember.upsert({
    where: { email: 'karl@example.com' },
    update: {},
    create: {
      name: 'Karl',
      email: 'karl@example.com'
    }
  })

  const lasersox = await prisma.teamMember.upsert({
    where: { email: 'lasersox@example.com' },
    update: {},
    create: {
      name: 'lasersox',
      email: 'lasersox@example.com'
    }
  })

  const trimedx = await prisma.company.create({
    data: {
      name: 'TrimedX',
      industry: 'Healthcare',
      website: 'https://trimedx.com'
    }
  })

  const accel = await prisma.company.create({
    data: {
      name: 'Accel',
      industry: 'Venture Capital',
      website: 'https://accel.com'
    }
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })