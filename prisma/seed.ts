import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';
// Natively using Node.js for straightforward seeding via process.env execution
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'dummy@example.com' },
    update: {},
    create: {
      id: 'dummy-user-id-1',
      email: 'dummy@example.com',
      theme_pref: 'dark',
    },
  });

  const categories = [
    { id: 'cat-1', name: 'Makanan & Minuman', icon: 'restaurant', color: '#ffb4ab', is_default: true, user_id: user.id },
    { id: 'cat-2', name: 'Transportasi', icon: 'directions_car', color: '#adc6ff', is_default: true, user_id: user.id },
    { id: 'cat-3', name: 'Hiburan', icon: 'movie', color: '#4edea3', is_default: true, user_id: user.id },
    { id: 'cat-4', name: 'Belanja', icon: 'shopping_bag', color: '#ffdadb', is_default: true, user_id: user.id },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }

  // Generate 10 dummy transactions across the last 5 days
  const transactions = [];
  for (let i = 1; i <= 10; i++) {
    const cat = categories[i % categories.length];
    transactions.push({
      id: `trx-${i}`,
      user_id: user.id,
      amount: Math.floor(Math.random() * 50) + 15,
      category_id: cat.id,
      note: `Contoh pengeluaran dummy ke-${i}`,
      date: new Date(new Date().setDate(new Date().getDate() - Math.floor((i-1)/2))),
    });
  }

  for (const t of transactions) {
    await prisma.transaction.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
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
