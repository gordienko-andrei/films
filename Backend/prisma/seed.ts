import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emotions = [
  {
    name: 'Love it',
    emoji: '❤️',
    slug: 'love',
  },
  {
    name: 'Funny',
    emoji: '😂',
    slug: 'funny',
  },
  {
    name: 'Wow',
    emoji: '😮',
    slug: 'wow',
  },
  {
    name: 'Sad',
    emoji: '😢',
    slug: 'sad',
  },
  {
    name: 'Amazing',
    emoji: '🌟',
    slug: 'amazing',
  }
];

async function main() {
  console.log('Start seeding emotions...');

  for (const emotion of emotions) {
    const existingEmotion = await prisma.emotion.findUnique({
      where: { slug: emotion.slug },
    });

    if (!existingEmotion) {
      await prisma.emotion.create({
        data: emotion,
      });
      console.log(`Created emotion: ${emotion.name}`);
    } else {
      console.log(`Emotion ${emotion.name} already exists`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 