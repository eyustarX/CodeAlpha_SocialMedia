-- CreateTable social_users
CREATE TABLE IF NOT EXISTS "social_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "bio" TEXT DEFAULT '',
    "avatarUrl" TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable social_posts
CREATE TABLE IF NOT EXISTS "social_posts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable social_comments
CREATE TABLE IF NOT EXISTS "social_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable social_likes
CREATE TABLE IF NOT EXISTS "social_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable social_follows
CREATE TABLE IF NOT EXISTS "social_follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "social_users_username_key" ON "social_users"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "social_users_email_key" ON "social_users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "social_likes_userId_postId_key" ON "social_likes"("userId", "postId");
CREATE UNIQUE INDEX IF NOT EXISTS "social_follows_followerId_followingId_key" ON "social_follows"("followerId", "followingId");

-- AddForeignKey
ALTER TABLE "social_posts" DROP CONSTRAINT IF EXISTS "social_posts_authorId_fkey";
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "social_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_comments" DROP CONSTRAINT IF EXISTS "social_comments_authorId_fkey";
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "social_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_comments" DROP CONSTRAINT IF EXISTS "social_comments_postId_fkey";
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_likes" DROP CONSTRAINT IF EXISTS "social_likes_userId_fkey";
ALTER TABLE "social_likes" ADD CONSTRAINT "social_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "social_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_likes" DROP CONSTRAINT IF EXISTS "social_likes_postId_fkey";
ALTER TABLE "social_likes" ADD CONSTRAINT "social_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_follows" DROP CONSTRAINT IF EXISTS "social_follows_followerId_fkey";
ALTER TABLE "social_follows" ADD CONSTRAINT "social_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "social_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "social_follows" DROP CONSTRAINT IF EXISTS "social_follows_followingId_fkey";
ALTER TABLE "social_follows" ADD CONSTRAINT "social_follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "social_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
