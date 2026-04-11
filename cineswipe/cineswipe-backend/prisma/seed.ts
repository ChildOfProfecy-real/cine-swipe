import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample video URLs from Google's public bucket
const SAMPLE_VIDEOS = [
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

// Movie data (from mockData.ts)
const MOVIES = [
    { title: 'Inception', description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', genre: 'Sci-Fi', seed: 'inception' },
    { title: 'The Dark Knight', description: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests to fight injustice.', genre: 'Action', seed: 'darkknight' },
    { title: 'Interstellar', description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", genre: 'Sci-Fi', seed: 'interstellar' },
    { title: 'The Matrix', description: 'A computer programmer discovers that reality as he knows it is a simulation and joins a rebellion to break free.', genre: 'Sci-Fi', seed: 'matrix' },
    { title: 'Pulp Fiction', description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.', genre: 'Drama', seed: 'pulpfiction' },
    { title: 'Avengers: Endgame', description: 'After the devastating events of Infinity War, the Avengers assemble once more to undo Thanos actions and restore balance.', genre: 'Action', seed: 'endgame' },
    { title: 'Parasite', description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', genre: 'Thriller', seed: 'parasite' },
    { title: 'Joker', description: 'A mentally troubled stand-up comedian embarks on a downward spiral that leads to the creation of an iconic villain.', genre: 'Drama', seed: 'joker' },
    { title: 'Spider-Man: No Way Home', description: 'Peter Parker seeks help from Doctor Strange when his identity is revealed, causing the multiverse to collapse.', genre: 'Action', seed: 'spiderman' },
    { title: 'Dune', description: 'Paul Atreides, a young man born into a great destiny, must travel to the most dangerous planet in the universe.', genre: 'Sci-Fi', seed: 'dune' },
    { title: 'The Godfather', description: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', genre: 'Drama', seed: 'godfather' },
    { title: 'Fight Club', description: 'An insomniac office worker and a soap salesman build a global organization to help vent male aggression.', genre: 'Drama', seed: 'fightclub' },
    { title: 'Forrest Gump', description: 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man with an IQ of 75.', genre: 'Drama', seed: 'forrestgump' },
    { title: 'The Shawshank Redemption', description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', genre: 'Drama', seed: 'shawshank' },
    { title: 'Gladiator', description: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.', genre: 'Action', seed: 'gladiator' },
    { title: 'The Lion King', description: 'Lion prince Simba flees after the death of his father and returns as an adult to reclaim his throne.', genre: 'Animation', seed: 'lionking' },
    { title: 'Titanic', description: 'A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious Titanic.', genre: 'Romance', seed: 'titanic' },
    { title: 'Avatar', description: 'A paraplegic Marine dispatched to Pandora becomes torn between following his orders and protecting the world he calls home.', genre: 'Sci-Fi', seed: 'avatar' },
    { title: 'The Prestige', description: 'Two stage magicians engage in a bitter rivalry, each trying to discover the secret of the others tricks.', genre: 'Thriller', seed: 'prestige' },
    { title: 'Django Unchained', description: 'A freed slave sets out to rescue his wife from a brutal plantation owner with the help of a German bounty hunter.', genre: 'Action', seed: 'django' },
    { title: 'The Social Network', description: 'The story of the founding of Facebook and the lawsuits that followed its meteoric rise.', genre: 'Drama', seed: 'socialnetwork' },
    { title: 'Mad Max: Fury Road', description: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler with the help of a drifter.', genre: 'Action', seed: 'madmax' },
    { title: 'Whiplash', description: 'A promising young drummer enrolls at a cutthroat music conservatory where his dreams of greatness are mentored by an abusive instructor.', genre: 'Drama', seed: 'whiplash' },
    { title: 'Get Out', description: 'A young African-American visits his white girlfriends parents and uncovers a disturbing secret.', genre: 'Horror', seed: 'getout' },
    { title: 'La La Land', description: 'A jazz musician and an aspiring actress fall in love while pursuing their dreams in Los Angeles.', genre: 'Romance', seed: 'lalaland' },
];

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.userList.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.clip.deleteMany();
    await prisma.movie.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    console.log('👤 Creating test users...');
    const testPassword = await bcrypt.hash('test123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.createMany({
        data: [
            {
                email: 'test@cineswipe.com',
                password: testPassword,
                name: 'Test User',
                isAdmin: false,
            },
            {
                email: 'admin@cineswipe.com',
                password: adminPassword,
                name: 'Admin User',
                isAdmin: true,
            },
        ],
    });
    console.log('✅ Created 2 users (test@cineswipe.com / test123, admin@cineswipe.com / admin123)');

    // Create movies with random clips
    console.log('🎬 Creating movies with clips...');
    let totalClips = 0;

    for (const movie of MOVIES) {
        // Random number of clips between 1-10
        const numClips = getRandomInt(1, 10);
        totalClips += numClips;

        const clips = Array.from({ length: numClips }, (_, i) => ({
            videoUrl: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length],
            sequence: i + 1,
            duration: getRandomInt(30, 120), // 30-120 seconds
        }));

        await prisma.movie.create({
            data: {
                title: movie.title,
                description: movie.description,
                genre: movie.genre,
                thumbnailUrl: `https://picsum.photos/seed/${movie.seed}/300/450`,
                heroUrl: `https://picsum.photos/seed/${movie.seed}-hero/800/450`,
                clips: {
                    create: clips,
                },
            },
        });

        console.log(`  ✅ ${movie.title} (${numClips} clips)`);
    }

    console.log(`\n🎉 Seed complete!`);
    console.log(`   - 2 users created`);
    console.log(`   - ${MOVIES.length} movies created`);
    console.log(`   - ${totalClips} total clips created`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
