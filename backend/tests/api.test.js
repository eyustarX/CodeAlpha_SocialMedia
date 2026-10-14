const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

jest.setTimeout(45000); // Allow sufficient time for Neon DB roundtrips

describe('CodeAlpha Mini Social Media Platform API Test Suite', () => {
  const runId = Date.now();
  let userA = {
    name: 'Alice Developer',
    username: `alice_${runId}`,
    email: `alice_${runId}@example.com`,
    password: 'Password123!',
    token: null,
    id: null,
  };

  let userB = {
    name: 'Bob Coder',
    username: `bob_${runId}`,
    email: `bob_${runId}@example.com`,
    password: 'Password123!',
    token: null,
    id: null,
  };

  let createdPostId = null;
  let createdCommentId = null;

  afterAll(async () => {
    try {
      const userIdsToDelete = [userA.id, userB.id].filter(Boolean);
      if (userIdsToDelete.length > 0) {
        // Cascade delete will remove posts, comments, likes, and follows
        await prisma.user.deleteMany({
          where: { id: { in: userIdsToDelete } },
        });
      }
    } catch (err) {
      console.error('Error during test cleanup:', err.message);
    } finally {
      await prisma.$disconnect();
    }
  });

  describe('1. Health and Base API Endpoints', () => {
    it('GET /health - should return 200 and health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('healthy');
    });

    it('GET /api/v1 - should return 200 and welcome message', async () => {
      const res = await request(app).get('/api/v1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Welcome to CodeAlpha Social Media API');
    });
  });

  describe('2. User Authentication and Account Management', () => {
    it('POST /api/v1/auth/register - should fail on missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'bad@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/register - should successfully register User A', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: userA.name,
          username: userA.username,
          email: userA.email,
          password: userA.password,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(userA.email);
      expect(res.body.data.user.username).toBe(userA.username);
      expect(res.body.data.token).toBeDefined();

      userA.id = res.body.data.user.id;
      userA.token = res.body.data.token;
    });

    it('POST /api/v1/auth/register - should reject duplicate username or email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Clone Alice',
          username: userA.username,
          email: userA.email,
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/login - should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: userA.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/login - should login User A successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: userA.username,
          password: userA.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.id).toBe(userA.id);
    });

    it('GET /api/v1/auth/me - should return User A profile when authorized', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(userA.id);
      expect(res.body.data.username).toBe(userA.username);
    });

    it('GET /api/v1/auth/me - should reject request without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/auth/register - should successfully register User B', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: userB.name,
          username: userB.username,
          email: userB.email,
          password: userB.password,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      userB.id = res.body.data.user.id;
      userB.token = res.body.data.token;
    });
  });

  describe('3. Posts Creation and Feeds', () => {
    it('POST /api/v1/posts - should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .send({ content: 'Hello unauthorized world!' });

      expect(res.status).toBe(401);
    });

    it('POST /api/v1/posts - should allow User A to create a new post', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({
          content: 'Excited to build my mini social media application on CodeAlpha!',
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();

      createdPostId = res.body.data.id;

      expect(res.body.data.authorId).toBe(userA.id);
      expect(res.body.data.content).toContain('CodeAlpha');
    });

    it('GET /api/v1/posts - should return explore feed containing created post', async () => {
      const res = await request(app)
        .get('/api/v1/posts')
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const targetPost = res.body.data.find((p) => p.id === createdPostId);
      expect(targetPost).toBeDefined();
      expect(targetPost.author.username).toBe(userA.username);
      expect(targetPost.likesCount).toBe(0);
      expect(targetPost.isLikedByMe).toBe(false);
    });

    it('GET /api/v1/posts/:id - should return post details with empty comments list', async () => {
      const res = await request(app).get(`/api/v1/posts/${createdPostId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdPostId);
      expect(Array.isArray(res.body.data.comments)).toBe(true);
    });
  });

  describe('4. Likes and Comments System', () => {
    it('POST /api/v1/posts/:id/like - User B likes User A post', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${createdPostId}/like`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isLiked).toBe(true);
      expect(res.body.data.likesCount).toBe(1);
    });

    it('POST /api/v1/posts/:id/like - User B unlikes User A post (toggle)', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${createdPostId}/like`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isLiked).toBe(false);
      expect(res.body.data.likesCount).toBe(0);
    });

    it('POST /api/v1/posts/:id/comments - User B posts a comment', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${createdPostId}/comments`)
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ content: 'Awesome project, congratulations!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();

      createdCommentId = res.body.data.id;

      expect(res.body.data.content).toBe('Awesome project, congratulations!');
      expect(res.body.data.author.id).toBe(userB.id);
    });

    it('DELETE /api/v1/comments/:id - User A cannot delete User B comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('DELETE /api/v1/comments/:id - User B successfully deletes own comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Social Follow Graph and Personalized Feed', () => {
    it('POST /api/v1/users/:id/follow - User B follows User A', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${userA.id}/follow`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFollowing).toBe(true);
      expect(res.body.data.followersCount).toBe(1);
    });

    it('GET /api/v1/users/:username - retrieves User A profile with follow state', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${userA.username}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(userA.username);
      expect(res.body.data.followersCount).toBe(1);
      expect(res.body.data.isFollowedByMe).toBe(true);
    });

    it('GET /api/v1/posts/feed - User B following feed contains User A post', async () => {
      const res = await request(app)
        .get('/api/v1/posts/feed')
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const found = res.body.data.some((p) => p.id === createdPostId);
      expect(found).toBe(true);
    });

    it('POST /api/v1/users/:id/follow - User B unfollows User A', async () => {
      const res = await request(app)
        .post(`/api/v1/users/${userA.id}/follow`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFollowing).toBe(false);
      expect(res.body.data.followersCount).toBe(0);
    });
  });

  describe('6. Post Deletion and Authorization', () => {
    it('DELETE /api/v1/posts/:id - User B cannot delete User A post', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('DELETE /api/v1/posts/:id - User A deletes own post', async () => {
      const res = await request(app)
        .delete(`/api/v1/posts/${createdPostId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/v1/posts/:id - deleted post should return 404', async () => {
      const res = await request(app).get(`/api/v1/posts/${createdPostId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
