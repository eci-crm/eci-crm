# ECI CRM - Enterprise Customer Intelligence

A modern CRM system built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui.

**Built by Irfan Munir**

## Features

- 🔐 **Role-Based Access Control** - Admin, Manager, Sales Rep, Viewer roles
- 👥 **Contact Management** - Track leads, prospects, and customers
- 📋 **Proposals with Budgets** - Create and manage sales proposals with detailed budgets
- ✅ **Task Management** - Track tasks with priorities and assignments
- 📊 **Dashboard Analytics** - Visual overview of key metrics
- 🌙 **Dark Mode** - Full dark mode support
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL (via Prisma ORM)
- **State:** Zustand
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon, Supabase, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/eci-crm.git
cd eci-crm
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your PostgreSQL connection string:
```
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

After starting the app, visit `/api/setup` to seed demo users:

- **Admin:** admin@crm.com
- **Manager:** manager@crm.com  
- **Sales Rep:** sales@crm.com
- **Viewer:** viewer@crm.com

Password for all: `password123`

## Deployment to Vercel

1. Push your code to GitHub
2. Import the project to Vercel
3. Add your `DATABASE_URL` environment variable
4. Deploy!

## License

MIT License - Built by Irfan Munir
