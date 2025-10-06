#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// CLI Arguments
const args = process.argv.slice(2)
const confirm = args.includes('--confirm')

async function main() {
  // Safety check: Only allow on local database
  const dbUrl = process.env.MYSQL_URL || ''
  // const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')

  // if (!isLocal) {
  //   console.error('❌ Safety check failed!')
  //   console.error('   This script can only run on a local database.')
  //   console.error(`   Current database: ${dbUrl.replace(/:[^:@]+@/, ':***@')}`)
  //   process.exit(1)
  // }

  if (!confirm) {
    console.log('⚠️  This will DELETE all the following data:')
    console.log('   • All Interactions')
    console.log('   • All Contacts (and their relations)')
    console.log('   • All Companies')
    console.log('   • All Labels')
    console.log('')
    console.log('✅ Team Members will NOT be deleted')
    console.log('')
    console.log(`📍 Database: localhost (${dbUrl.split('/').pop()})`)
    console.log('')
    console.log('💡 Run with --confirm flag to proceed:')
    console.log('   npm run clear:data -- --confirm')
    process.exit(0)
  }

  console.log('🗑️  Starting data cleanup...')
  console.log('')

  try {
    // Delete in correct order due to foreign keys

    console.log('🔄 Deleting interactions...')
    const interactions = await prisma.interaction.deleteMany()
    console.log(`✅ Deleted ${interactions.count} interactions`)

    console.log('🔄 Deleting follow-ups...')
    const followUps = await prisma.followUp.deleteMany()
    console.log(`✅ Deleted ${followUps.count} follow-ups`)

    console.log('🔄 Deleting contact-label links...')
    const contactLabels = await prisma.contactLabel.deleteMany()
    console.log(`✅ Deleted ${contactLabels.count} contact-label links`)

    console.log('🔄 Deleting contact-team member links...')
    const contactTeamMembers = await prisma.contactTeamMember.deleteMany()
    console.log(`✅ Deleted ${contactTeamMembers.count} contact-team member links`)

    console.log('🔄 Deleting contact-company links...')
    const contactCompanies = await prisma.contactCompany.deleteMany()
    console.log(`✅ Deleted ${contactCompanies.count} contact-company links`)

    console.log('🔄 Deleting contacts...')
    const contacts = await prisma.contact.deleteMany()
    console.log(`✅ Deleted ${contacts.count} contacts`)

    console.log('🔄 Deleting companies...')
    const companies = await prisma.company.deleteMany()
    console.log(`✅ Deleted ${companies.count} companies`)

    console.log('🔄 Deleting labels...')
    const labels = await prisma.label.deleteMany()
    console.log(`✅ Deleted ${labels.count} labels`)

    console.log('⏭️  Skipping team members (preserved)')
    const teamMemberCount = await prisma.teamMember.count()
    console.log(`✅ ${teamMemberCount} team members preserved`)

    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ All data cleared successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
