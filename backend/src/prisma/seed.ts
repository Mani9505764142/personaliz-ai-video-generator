import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      phone: '+1234567890',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      phone: '+1234567891',
    },
  });

  // Create sample video requests
  const video1 = await prisma.videoRequest.create({
    data: {
      userId: user1.id,
      prompt: 'Create a personalized video greeting for John\'s birthday',
      status: 'COMPLETED',
      videoUrl: 'https://example.com/videos/john-birthday.mp4',
      thumbnailUrl: 'https://example.com/thumbnails/john-birthday.jpg',
      metadata: {
        duration: 30,
        resolution: '1080p',
        format: 'mp4',
      },
    },
  });

  const video2 = await prisma.videoRequest.create({
    data: {
      userId: user2.id,
      prompt: 'Generate a motivational video for Jane\'s fitness journey',
      status: 'PROCESSING',
      metadata: {
        theme: 'fitness',
        duration: 45,
      },
    },
  });

  // Create sample WhatsApp messages
  await prisma.whatsappMessage.create({
    data: {
      userId: user1.id,
      videoRequestId: video1.id,
      messageId: 'wamid.1234567890',
      phoneNumber: '+1234567890',
      messageType: 'VIDEO',
      content: 'https://example.com/videos/john-birthday.mp4',
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  await prisma.whatsappMessage.create({
    data: {
      userId: user2.id,
      messageId: 'wamid.1234567891',
      phoneNumber: '+1234567891',
      messageType: 'TEXT',
      content: 'Your video is being processed. We\'ll notify you when it\'s ready!',
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created users: ${user1.email}, ${user2.email}`);
  console.log(`Created video requests: ${video1.id}, ${video2.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
