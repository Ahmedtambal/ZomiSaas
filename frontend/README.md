# Zomi Wealth Portal - Frontend

React + TypeScript + Vite frontend for the Zomi Wealth Management Portal.

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Supabase JS** - Backend integration
- **lucide-react** - Icons
- **@dnd-kit** - Drag and drop

## 📋 Prerequisites

- Node.js 18+
- npm or yarn

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🌍 Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/          # Login, Register
│   ├── dashboard/     # KPI Dashboard
│   ├── forms/         # Form Builder & Renderer
│   ├── layout/        # App Layout
│   ├── members/       # Member Management
│   └── settings/      # Settings Pages
├── context/           # React Context (Auth)
├── types/             # TypeScript types
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## 🎨 Features

- Executive dashboard with KPIs
- Member database management (2 databases)
- Dynamic form builder
- Invite-only authentication
- Role-based access control
- CSV export functionality
- Real-time data updates

## 🔧 Build Configuration

- **Vite Config**: `vite.config.ts`
- **TypeScript**: `tsconfig.json`, `tsconfig.app.json`
- **Tailwind**: `tailwind.config.js`
- **PostCSS**: `postcss.config.js`
- **ESLint**: `eslint.config.js`

## 📦 Dependencies

See `package.json` for full list of dependencies.

---

Built with ❤️ for UK Wealth Advisers
