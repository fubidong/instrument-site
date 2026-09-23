const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkMedia() {
  try {
    // 检查所有素材
    const allAssets = await db.mediaAsset.findMany({
      select: { id: true, filename: true, path: true, kind: true, category: true },
      take: 20
    });
    console.log('All assets:', JSON.stringify(allAssets, null, 2));
    
    // 检查图片素材
    const imageAssets = await db.mediaAsset.findMany({
      where: { kind: 'image' },
      select: { id: true, filename: true, path: true },
      take: 10
    });
    console.log('Image assets:', JSON.stringify(imageAssets, null, 2));
    
    // 统计
    const counts = await db.mediaAsset.groupBy({
      by: ['kind'],
      _count: true
    });
    console.log('Counts by kind:', JSON.stringify(counts, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await db.$disconnect();
  }
}

checkMedia();
