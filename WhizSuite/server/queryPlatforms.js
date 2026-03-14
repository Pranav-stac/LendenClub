
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const platforms = await prisma.platform.findMany();
    console.log(JSON.stringify(platforms, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
