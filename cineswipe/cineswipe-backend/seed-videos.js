const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding real video URLs to all clips...');
    
    // A reliable, public sample video (Big Buck Bunny)
    const testVideoUrl = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    const result = await prisma.clip.updateMany({
        data: {
            videoUrl: testVideoUrl
        }
    });

    console.log(`Updated ${result.count} clips with real test video URL.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
