const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Updating all clip URLs to HTTPS...');
    
    const clips = await prisma.clip.findMany();
    let updated = 0;
    
    for (const clip of clips) {
        if (clip.videoUrl && clip.videoUrl.startsWith('http://')) {
            const httpsUrl = clip.videoUrl.replace('http://', 'https://');
            await prisma.clip.update({
                where: { id: clip.id },
                data: { videoUrl: httpsUrl }
            });
            updated++;
        }
    }

    console.log(`Updated ${updated} clips to use HTTPS.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
