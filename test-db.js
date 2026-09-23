const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
  } catch (e) {
    console.error('❌ Database connection error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
