const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating broken Google Cloud video URLs to working W3C MP4 URLs...');
    
    const workingUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
    
    const result = await prisma.clip.updateMany({
        where: {
            videoUrl: {
                contains: 'googleapis.com'
            }
        },
        data: {
            videoUrl: workingUrl
        }
    });

    console.log(`Successfully fixed ${result.count} clips!`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
