/**
 * Script to deactivate all existing platform connections
 * Run this to require users to reactivate their connections
 * 
 * Usage: npx ts-node server/scripts/deactivate-existing-connections.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deactivating all existing platform connections...');
  
  const result = await prisma.platformConnection.updateMany({
    data: { isActive: false }
  });
  
  console.log(`✅ Deactivated ${result.count} platform connection(s)`);
  console.log('Users will need to activate their connections in the platform settings.');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





