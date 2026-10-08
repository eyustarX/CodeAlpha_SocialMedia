require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  console.log('Applying social media schema to Neon database...');
  const sql = fs.readFileSync('prisma/migrations/20261006175000_init_social_media/migration.sql', 'utf8');

  // Split into individual SQL statements
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log('✅ Migration applied successfully! Tables created: social_users, social_posts, social_comments, social_likes, social_follows');
}

runMigration()
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
