# Postman Collection Setup Guide

Before you can test the APIs with the Postman collection, you need to set up the database and backend server.

## Prerequisites

1. **PostgreSQL 14+** - Make sure PostgreSQL is installed and running
2. **Redis** (optional for now) - Required for scheduling features, but can be skipped for basic API testing
3. **Node.js 18+** - Should already be installed

## Step-by-Step Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE whizsuite;

# Exit psql
\q
```

### 2. Set Up Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
# Create .env file (or copy from .env.example if it exists)
```

**Minimum required `.env` file contents:**

```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/whizsuite?schema=public"

# JWT Secrets (change these in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Storage (use local for development)
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_PATH="./uploads"

# Redis (optional - can use defaults if not running)
REDIS_HOST=localhost
REDIS_PORT=6379

# OAuth (optional - only needed for social media platform integrations)
# FACEBOOK_APP_ID=""
# FACEBOOK_APP_SECRET=""
# TWITTER_CLIENT_ID=""
# TWITTER_CLIENT_SECRET=""
# LINKEDIN_CLIENT_ID=""
# LINKEDIN_CLIENT_SECRET=""
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
```

### 3. Install Dependencies (if not already done)

```bash
cd server
npm install
```

### 4. Run Database Migrations

This will create all the database tables:

```bash
cd server
npm run db:migrate
```

Or if you prefer to push the schema directly:

```bash
npm run db:push
```

### 5. Seed the Database

This creates the initial permissions needed for the system:

```bash
cd server
npm run db:seed
```

**Expected output:**
```
🌱 Seeding database...
✅ Created XX permissions
✅ Database seeding completed!
```

### 6. Start the Backend Server

```bash
cd server
npm run dev
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 WhizSuite Server is running!                        ║
║                                                           ║
║   Local:    http://localhost                        ║
║   Health:   http://localhost/health                 ║
║   API:      http://localhost/api                    ║
║                                                           ║
║   Environment: development                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 7. Verify Server is Running

Test the health endpoint in Postman or browser:
```
GET http://localhost/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

## Using the Postman Collection

### Import the Collection

1. Open Postman
2. Click **Import** button
3. Select `WhizSuite_API.postman_collection.json`
4. The collection will appear in your workspace

### Collection Variables

The collection has these variables (you can edit them in Postman):
- `baseUrl` - Set to `http://localhost` by default
- `authToken` - Will be auto-populated after login
- `refreshToken` - Will be auto-populated after login
- `workspaceId` - You'll need to set this manually after creating/getting a workspace

### Testing Flow

1. **Start with Health Check** - Verify server is running
   - `GET /health`

2. **Register a User** (first time only)
   - `POST /api/auth/register`
   - Use sample body or your own credentials

3. **Login** (automatically saves tokens)
   - `POST /api/auth/login`
   - This will automatically save `authToken` and `refreshToken` to collection variables

4. **Get Your Workspaces**
   - `GET /api/workspaces/my`
   - Copy the `id` of a workspace

5. **Set Workspace ID**
   - In Postman, click on the collection → Variables tab
   - Set `workspaceId` to the workspace ID you copied
   - OR manually add `x-workspace-id` header to each request

6. **Test Other Endpoints**
   - Now you can test all other endpoints with authentication

### Quick Test Sequence

```
1. Health Check → Verify server is up
2. Register → Create a new user
3. Login → Get auth tokens (auto-saved)
4. Get My Workspaces → Get workspace ID
5. Create Client → Test authenticated endpoint
6. Get Clients → Verify it was created
```

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `psql -U postgres -l`
- Check `DATABASE_URL` in `.env` file is correct
- Ensure database `whizsuite` exists

### Migration Errors
- Make sure database is empty or previous migrations are applied
- Try `npm run db:push` instead of `db:migrate` for development

### Authentication Errors (401)
- Make sure you've logged in first
- Check that `authToken` variable is set in the collection
- Token might be expired - try logging in again

### Workspace Errors (403/404)
- Make sure you've set the `workspaceId` variable
- OR manually add `x-workspace-id` header to requests
- Verify you're a member of the workspace you're trying to access

### Port Already in Use
- Change `PORT` in `.env` file to a different port (e.g., 5001)
- Update `baseUrl` in Postman collection to match

## Optional: View Database with Prisma Studio

```bash
cd server
npm run db:studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit your database directly.


