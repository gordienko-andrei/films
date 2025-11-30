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

const criterionTemplates = [
  {
    name: 'Plot',
    category: 'story',
    weight: 1.0,
    isRequired: false,
  },
  {
    name: 'Acting',
    category: 'acting',
    weight: 1.0,
    isRequired: false,
  },
  {
    name: 'Visual Effects',
    category: 'technical',
    weight: 1.0,
    isRequired: false,
  },
  {
    name: 'Sound & Music',
    category: 'technical',
    weight: 1.0,
    isRequired: false,
  },
  {
    name: 'Direction',
    category: 'direction',
    weight: 1.0,
    isRequired: false,
  },
];

const reviewTags = [
  {
    name: 'Atmospheric',
    category: 'mood',
  },
  {
    name: 'Emotional',
    category: 'mood',
  },
  {
    name: 'Action-packed',
    category: 'genre-feel',
  },
  {
    name: 'Comedy',
    category: 'genre-feel',
  },
  {
    name: 'Dramatic',
    category: 'genre-feel',
  },
  {
    name: 'Suspenseful',
    category: 'genre-feel',
  },
  {
    name: 'Family-friendly',
    category: 'audience',
  },
  {
    name: 'Mature',
    category: 'audience',
  },
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

  console.log('Start seeding criterion templates...');

  for (const template of criterionTemplates) {
    const existingTemplate = await prisma.reviewCriterionTemplate.findUnique({
      where: { name: template.name },
    });

    if (!existingTemplate) {
      await prisma.reviewCriterionTemplate.create({
        data: template,
      });
      console.log(`Created criterion template: ${template.name}`);
    } else {
      console.log(`Criterion template ${template.name} already exists`);
    }
  }

  console.log('Start seeding review tags...');

  for (const tag of reviewTags) {
    const existingTag = await prisma.reviewTag.findUnique({
      where: { name: tag.name },
    });

    if (!existingTag) {
      await prisma.reviewTag.create({
        data: tag,
      });
      console.log(`Created review tag: ${tag.name}`);
    } else {
      console.log(`Review tag ${tag.name} already exists`);
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