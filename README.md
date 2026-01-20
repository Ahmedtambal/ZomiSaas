# Zomi Wealth Portal - Corporate Wealth Management SaaS

A professional wealth management dashboard for UK-based pension scheme advisers. Built with React, TypeScript, Supabase, and hosted on Render.

## 🚀 Features

- **Executive Dashboard**: Real-time KPIs, member analytics, and financial insights
- **Member Management**: Two databases (IO Upload & New Employee) with 35+ fields
- **Dynamic Form Builder**: Create custom forms with 8 field types and validation
- **Invite-Only Authentication**: Secure 6-digit invite code system
- **Role-Based Access**: Admin and Member roles with granular permissions
- **Data Export**: CSV templates for Scottish Widows and IO Bulk
- **UK/GDPR Compliant**: Hosted in London region with PII masking

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Supabase (Auth + PostgreSQL + Realtime)
- **Hosting**: Render (eu-central region)
- **UI Libraries**: lucide-react, @dnd-kit

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Render account

## 🔧 Local Development

```bash
# Clone repository
git clone https://github.com/Ahmedtambal/ZomiSaas.git
cd ZomiSaas

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Supabase credentials to .env
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key

# Start dev server
npm run dev
```

## 🗄️ Database Setup

See `supabase/migrations/` for SQL schema files.

## 🚀 Deployment

Render automatically deploys using `render.yaml` configuration.
