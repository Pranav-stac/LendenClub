# WhizSuite Setup Guide

## Quick Start

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file (copy from env.example.txt)
# Edit .env with your database URL, AWS credentials, etc.

# Generate Prisma client
npx prisma generate

# Setup database
npx prisma db push

# Seed initial data (permissions, platforms)
npm run db:seed

# Start server
npm run dev
```

**Required .env variables for server:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: ap-south-1)
- `AWS_S3_BUCKET` - S3 bucket name

### 2. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Create .env.local file (copy from env.example.txt)
# Usually the default API URL is fine

# Start dev server
npm run dev
```

**Required .env.local variables for client:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost/api)

## Database Setup

1. Install PostgreSQL
2. Create a database:
   ```sql
   CREATE DATABASE whizsuite;
   ```
3. Update `DATABASE_URL` in server `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/whizsuite?schema=public"
   ```
4. Run migrations:
   ```bash
   cd server
   npx prisma db push
   ```
5. Seed data:
   ```bash
   npm run db:seed
   ```

## AWS S3 Setup

1. Create an S3 bucket in AWS
2. Configure CORS on the bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
3. Create IAM user with S3 access
4. Add credentials to server `.env`:
   ```
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET=your-bucket-name
   ```

## Testing the Setup

1. Start the backend server (should show "🚀 WhizSuite Server is running!")
2. Start the frontend (should open on http://localhost:3000)
3. Visit http://localhost:3000
4. You should be redirected to login
5. Register a new account
6. Create a workspace
7. Start using the platform!

## Troubleshooting

### Server won't start
- Check database connection
- Verify all .env variables are set
- Run `npx prisma generate` again
- Check port 5000 is not in use

### Frontend won't start
- Check Node.js version (18+)
- Delete node_modules and reinstall
- Check if backend is running

### Database errors
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Run `npx prisma db push` to sync schema

### S3 upload errors
- Verify AWS credentials
- Check bucket name and region
- Verify bucket CORS settings
- Check IAM permissions


