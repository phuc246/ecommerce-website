const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const { count } = await prisma.log.deleteMany({});
    console.log(`Successfully deleted ${count} logs.`);
  } catch (error) {
    console.error('Error clearing logs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();