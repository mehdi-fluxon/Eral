# Todo App - Next.js with MySQL

A simple, elegant todo application built with Next.js 14, TypeScript, Prisma ORM, and MySQL.

## Features

- ✅ Create, read, update, and delete todos
- ✅ Real-time UI updates
- ✅ MySQL database with Prisma ORM
- ✅ Type-safe with TypeScript
- ✅ Beautiful UI with Tailwind CSS
- ✅ Server Components and API Routes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL
- **ORM**: Prisma
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MySQL database (local or cloud)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your database:

#### Option 1: Local MySQL (Current Setup)
- Install MySQL locally: `brew install mysql@8.4` (macOS) or download from mysql.com
- Start MySQL: `brew services start mysql@8.4`
- Create database: `mysql -u root -e "CREATE DATABASE todoapp;"`
- The `.env` file is already configured for local MySQL:
```env
DATABASE_URL="mysql://root:@localhost:3306/todoapp"
```

#### Option 2: Cloud Database 
- Use services like [PlanetScale](https://planetscale.com), [Railway](https://railway.app), or [DigitalOcean](https://digitalocean.com)
- Copy the connection string to your `.env` file

3. Run database migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
todo-app/
├── app/
│   ├── api/
│   │   └── todos/
│   │       ├── route.ts          # GET, POST endpoints
│   │       └── [id]/
│   │           └── route.ts      # PATCH, DELETE endpoints
│   ├── components/
│   │   ├── TodoList.tsx         # Main todo list component
│   │   ├── TodoItem.tsx         # Individual todo item
│   │   └── TodoForm.tsx         # Add todo form
│   ├── page.tsx                  # Home page
│   └── layout.tsx                # Root layout
├── lib/
│   └── prisma.ts                 # Prisma client singleton
├── prisma/
│   └── schema.prisma             # Database schema
└── .env                          # Environment variables
```

## API Endpoints

- `GET /api/todos` - Fetch all todos
- `POST /api/todos` - Create a new todo
- `PATCH /api/todos/[id]` - Update a todo
- `DELETE /api/todos/[id]` - Delete a todo

## Database Schema

```prisma
model Todo {
  id        String   @id @default(cuid())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your `DATABASE_URL` environment variable
4. Deploy!

### Database Setup for Production

1. Use a production database service (Neon, Supabase, etc.)
2. Add the connection string to your Vercel environment variables
3. Run migrations on the production database:
```bash
npx prisma migrate deploy
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npx prisma studio` - Open Prisma Studio (database GUI)

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your `DATABASE_URL` in `.env`
- Verify database credentials
- Try running `npx prisma generate` again

### Prisma Issues
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev` to apply migrations
- Use `npx prisma migrate reset` to reset the database

## License

MIT