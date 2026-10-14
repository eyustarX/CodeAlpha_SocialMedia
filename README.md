# CodeAlpha Mini Social Media Platform (`CodeAlpha_SocialMedia`)

A scalable, full-stack mini social media platform developed for **CodeAlpha Internship Task 2**. The platform enables users to publish posts, discover content across dual feeds (Global Explore & Personalized Following), interact via likes and threaded comments, and build social networks with a follow/unfollow graph system.

---

## 🚀 Key Features

- **User Authentication & Authorization**:
  - Secure registration and login using **JWT (JSON Web Tokens)** and **bcryptjs** (salted hashing).
  - Profile retrieval endpoint (`/me`) with authentication state caching on the client.
- **Dual Feed Architecture**:
  - **Explore Feed**: Public/authenticated chronological feed displaying posts across all creators with pagination support.
  - **Following Feed**: Personalized feed showing posts strictly from accounts the authenticated user follows, plus their own posts.
- **Rich Post Creation & Management**:
  - Post publishing with text content and optional media attachments (image URLs).
  - Strict post ownership authorization: only the original author can delete their posts.
- **Engagement & Interactions**:
  - **Atomic Toggle Likes**: Single-tap like and unlike mechanism with real-time like counters and per-user state tracking (`isLikedByMe`).
  - **Comment Discussions**: Real-time replies on posts with author-only deletion control.
- **Social Follow Graph**:
  - Follow / Unfollow creators with composite unique constraints in PostgreSQL (`followerId + followingId`).
  - Public creator profiles displaying bio, follower count, following count, total posts, and creator timeline.
- **Clean Frontend UI**:
  - Built with semantic HTML5, modern CSS design tokens, and modular Vanilla JavaScript without heavy frontend frameworks.
  - Responsive layout optimized for desktop, tablet, and mobile browsers.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Runtime** | Node.js (v18+), Express.js (CommonJS) |
| **Database & ORM** | PostgreSQL (Neon Serverless Cloud), Prisma ORM v6 (`@prisma/client`) |
| **Authentication** | JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **API Testing** | Jest, Supertest |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 Design Tokens |

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Frontend Client                      │
│   (HTML5, CSS3, Vanilla JS Fetch API, LocalStorage)   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON (REST API)
                           ▼
┌────────────────────────────────────────────────────────┐
│                Express.js Web Server                   │
│   ├── CORS, JSON Body Parser                           │
│   ├── JWT Authentication & Optional Auth Middleware   │
│   ├── Centralized Error Handler (400, 401, 403, 404)  │
│   └── API Routes: /auth, /posts, /comments, /users     │
└──────────────────────────┬─────────────────────────────┘
                           │ Prisma Client v6
                           ▼
┌────────────────────────────────────────────────────────┐
│           PostgreSQL Database (Neon Cloud)             │
│   ├── social_users     ├── social_posts                │
│   ├── social_likes     ├── social_comments             │
│   └── social_follows   (Indexed foreign keys & CASCADE)│
└────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema & Entity Relationships

```mermaid
erDiagram
    USER ||--o{ POST : "authors"
    USER ||--o{ COMMENT : "writes"
    USER ||--o{ LIKE : "gives"
    USER ||--o{ FOLLOW : "follows / followed by"
    POST ||--o{ COMMENT : "contains"
    POST ||--o{ LIKE : "receives"

    USER {
        uuid id PK
        string name
        string username UK
        string email UK
        string passwordHash
        string bio
        string avatarUrl
        datetime createdAt
    }

    POST {
        uuid id PK
        uuid authorId FK
        string content
        string imageUrl
        datetime createdAt
        datetime updatedAt
    }

    COMMENT {
        uuid id PK
        uuid postId FK
        uuid authorId FK
        string content
        datetime createdAt
    }

    LIKE {
        uuid id PK
        uuid postId FK
        uuid userId FK
        datetime createdAt
    }

    FOLLOW {
        uuid id PK
        uuid followerId FK
        uuid followingId FK
        datetime createdAt
    }
```

---

## 📂 Project Directory Structure

```
CodeAlpha_SocialMedia/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   └── 20261006175000_init_social_media/
│   │   │       └── migration.sql
│   │   ├── applyMigration.js       # Database migration utility
│   │   └── schema.prisma           # Prisma data models & Neon configuration
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js           # Prisma client singleton
│   │   ├── controllers/
│   │   │   ├── authController.js   # Register, Login, Me handlers
│   │   │   ├── postController.js   # Posts, Feeds, Likes, Comments handlers
│   │   │   └── userController.js   # Profiles, Follow graph handlers
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   # JWT verification middleware
│   │   │   ├── optionalAuth.js     # Non-blocking auth for feed likes
│   │   │   └── errorHandler.js     # Centralized 404 & error handlers
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # /api/v1/auth
│   │   │   ├── postRoutes.js       # /api/v1/posts
│   │   │   ├── commentRoutes.js    # /api/v1/comments
│   │   │   └── userRoutes.js       # /api/v1/users
│   │   ├── services/
│   │   │   ├── authService.js      # Auth business logic
│   │   │   ├── postService.js      # Feed generation & post logic
│   │   │   ├── interactionService.js # Likes & Comments transactional logic
│   │   │   └── userService.js      # Profile querying & Follow graph logic
│   │   ├── utils/
│   │   │   └── authUtils.js        # bcrypt and JWT helper utilities
│   │   ├── app.js                  # Express app setup & route binding
│   │   └── server.js               # HTTP listener initialization
│   ├── tests/
│   │   └── api.test.js             # 26 Jest + Supertest integration tests
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css               # Design system & responsive styles
│   ├── js/
│   │   ├── api.js                  # Fetch wrapper with Bearer token injection
│   │   ├── auth.js                 # LocalStorage session & dynamic navbar
│   │   ├── feed.js                 # Global & Following feed interactions
│   │   ├── postDetails.js          # Single post & comment stream handler
│   │   └── profile.js              # User profile & follow toggle controller
│   └── pages/
│       ├── index.html              # Main feed & post composer
│       ├── login.html              # User login screen
│       ├── register.html           # User registration screen
│       ├── post.html               # Single post & discussion thread
│       └── profile.html            # User profile & follow action screen
├── .gitignore
└── README.md
```

---

## 📡 REST API Reference

All API routes are prefixed with `/api/v1`.

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/register` | No | Register a new user account |
| `POST` | `/auth/login` | No | Authenticate user & issue JWT |
| `GET` | `/auth/me` | **Yes** | Fetch current authenticated user profile |

#### Register Request Example:
```json
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "bio": "Software developer & open-source enthusiast"
}
```

---

### 2. Posts & Feeds (`/api/v1/posts`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/posts` | Optional | Explore feed (global posts, paginated) |
| `GET` | `/posts/feed` | **Yes** | Personalized feed (followed users + self) |
| `GET` | `/posts/:id` | Optional | Get single post details with comments |
| `POST` | `/posts` | **Yes** | Create a new post |
| `DELETE` | `/posts/:id` | **Yes** | Delete a post (author only) |
| `POST` | `/posts/:id/like` | **Yes** | Toggle like on a post |
| `POST` | `/posts/:id/comments` | **Yes** | Add a comment to a post |
| `GET` | `/posts/:id/comments` | No | Get comments list for a post |

#### Create Post Request Example:
```json
POST /api/v1/posts
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "content": "Excited to share my latest project on SocialAlpha!",
  "imageUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"
}
```

---

### 3. Comments (`/api/v1/comments`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `DELETE` | `/comments/:id` | **Yes** | Delete a comment (author only) |

---

### 4. Users & Follow Graph (`/api/v1/users`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/users/:username` | Optional | Fetch creator profile by username |
| `GET` | `/users/:username/posts` | Optional | Fetch all posts by a specific user |
| `POST` | `/users/:id/follow` | **Yes** | Toggle follow/unfollow on target user |
| `GET` | `/users/:id/followers` | No | Get list of followers for a user |
| `GET` | `/users/:id/following` | No | Get list of users followed by target user |

---

## ⚡ Getting Started (Local Setup)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or later)
- [PostgreSQL](https://www.postgresql.org/) database or a free [Neon](https://neon.tech) cloud account

### 2. Clone the Repository
```bash
git clone https://github.com/eyustarX/CodeAlpha_SocialMedia.git
cd CodeAlpha_SocialMedia
```

### 3. Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create an environment configuration file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your PostgreSQL connection URL and JWT secret:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://username:password@ep-host.region.neon.tech/neondb?sslmode=require"
   JWT_SECRET="your_secure_jwt_secret_key"
   ```

4. Generate Prisma Client and apply migrations:
   ```bash
   npx prisma generate
   node prisma/applyMigration.js
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will be live at `http://localhost:5000`.

### 4. Frontend Launch
You can serve the frontend with any static web server or VS Code's **Live Server** extension:
```bash
# Example using npx serve or python http.server
cd ../frontend
npx serve .
# Open http://localhost:3000/pages/index.html in your browser
```

---

## 🧪 Automated Testing

The backend includes a comprehensive integration test suite covering the entire API lifecycle using **Jest** and **Supertest**.

To execute the test suite:
```bash
cd backend
npm test
```

### Test Coverage Highlights:
- ✅ **Health & Root Checks**: Verifies server responsiveness and API versioning.
- ✅ **Authentication**: Validates signup, duplicate user rejection, password hashing, valid & invalid login, and JWT Bearer authorization.
- ✅ **Posts & Feeds**: Verifies post publishing, pagination, explore feed querying, and single post details.
- ✅ **Interactions**: Tests atomic toggle likes (`0 -> 1 -> 0`), comment posting, and comment deletion permissions.
- ✅ **Follow Graph**: Tests following, follower counter increments, personalized following feed filtering, and unfollowing.
- ✅ **Security & Authorization**: Enforces 403 Forbidden checks when attempting to delete posts or comments belonging to other users.
- ✅ **Idempotent Teardown**: Automatically cleans up all test users, posts, and relation records via cascade deletion upon completion.

---

## 📄 License
This project was developed for the **CodeAlpha Internship Program**. Distributed under the MIT License.
