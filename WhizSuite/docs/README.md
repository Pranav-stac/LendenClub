# WhizSuite - Social Media Management Platform

A scalable, production-ready social media management platform built with Next.js and Node.js.

## 🚀 Features

- **Multi-tenant Workspaces** - Isolated workspaces for organizations
- **Team Management** - Role-based access control (RBAC)
- **Client & Brand Management** - Hierarchical organization
- **Social Media Integration** - Connect multiple platforms (Instagram, Facebook, Twitter, LinkedIn, YouTube, etc.)
- **Content Scheduling** - Schedule posts across platforms
- **Media Library** - AWS S3 integration with organized folder structure
- **Client Review System** - Shareable review links for content approval
- **Calendar View** - Visual calendar for scheduled posts and events
- **Analytics Dashboard** - Track performance and engagement

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL
- AWS S3 Bucket (for media storage)
- Redis (optional, for queue system)

## 🛠️ Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd WhizSuite
```

### 2. Backend Setup

```bash
cd server
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your configuration:
# - DATABASE_URL
# - AWS credentials
# - JWT secrets

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial data (permissions, platforms)
npm run db:seed

# Start development server
npm run dev
```

Server will run on `http://localhost`

### 3. Frontend Setup

```bash
cd client
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local if needed (usually default is fine)

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
WhizSuite/
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── modules/       # Feature modules
│   │   ├── shared/        # Shared utilities
│   │   └── lib/          # Libraries (S3, etc.)
│   └── prisma/           # Database schema
│
└── client/                # Frontend (Next.js 14)
    └── src/
        ├── app/          # Next.js app router pages
        ├── components/   # React components
        └── lib/         # API client & utilities
```

## 🔐 Environment Variables

### Server (.env)

See `server/.env.example` for all required variables.

### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost/api
```

## 🗄️ Database

The project uses PostgreSQL with Prisma ORM.

### Available Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Open Prisma Studio (database GUI)
npm run db:studio

# Run seed script
npm run db:seed
```

## 📡 API Documentation

API endpoints are documented in `WhizSuite_API.postman_collection.json`. Import this into Postman to test all endpoints.

### Main API Routes

- `/api/auth` - Authentication (register, login, refresh token)
- `/api/workspaces` - Workspace management
- `/api/clients` - Client CRUD
- `/api/brands` - Brand CRUD
- `/api/posts` - Post management and scheduling
- `/api/calendar` - Calendar events
- `/api/media` - Media uploads (S3)
- `/api/reviews` - Client review links
- `/api/platforms` - Platform connections
- `/api/dashboard` - Dashboard stats

All routes (except auth) require:
- `Authorization: Bearer <token>` header
- `X-Workspace-Id: <workspace-id>` header

## 🎨 Theming

The UI uses CSS variables for theming. Primary color is crimson red (`#DC143C`). You can customize colors in `client/src/app/globals.css`.

## 🔒 Authentication

- JWT-based authentication
- Access tokens (7 days expiry)
- Refresh tokens (30 days expiry)
- Automatic token refresh on expiry

## 📦 Key Technologies

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- AWS S3
- JWT
- Zod (validation)

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React 18
- CSS Modules

## 🚧 Development

### Running in Development

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

### Building for Production

**Backend:**
```bash
cd server
npm run build
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm start
```

## 📝 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
