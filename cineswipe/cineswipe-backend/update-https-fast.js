const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating all clip URLs to HTTPS using updateMany...');
    
    // Since we know they all start with http://commondatastorage...
    // we can just replace them with the exact HTTPS URL
    const httpsUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    const result = await prisma.clip.updateMany({
        where: {
            videoUrl: {
                startsWith: 'http://'
            }
        },
        data: {
            videoUrl: httpsUrl
        }
    });

    console.log(`Updated ${result.count} clips to use HTTPS.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
