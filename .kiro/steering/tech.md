---
inclusion: always
---

# Technology Stack

## Framework & Runtime

- **Next.js 15** with App Router (not Pages Router)
- **React 19** with Server Components
- **TypeScript 5** for type safety
- **Node.js 20+** runtime

## Database & Backend

- **Supabase** (PostgreSQL with Row Level Security)
- **@supabase/ssr** for server-side auth
- **@supabase/supabase-js** for client operations
- Server Actions for business logic (no separate API routes unless necessary)

## UI & Styling

- **Shadcn UI** components (Radix UI primitives)
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization

## Key Libraries

- **Decimal.js**: High-precision financial calculations (CRITICAL - always use for money/percentages)
- **jsPDF + jsPDF-AutoTable**: PDF generation
- **XLSX**: Excel import/export
- **class-variance-authority**: Component variants
- **tailwind-merge**: Utility class merging

## Development Tools

- **tsx**: TypeScript execution for scripts
- **ESLint**: Code linting
- **dotenv**: Environment variable management

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Production
npm run build           # Build for production
npm run start           # Start production server

# Utilities
npm run lint            # Run ESLint
npm run setup:auth      # Create superadmin user

# Scripts (use tsx)
npx tsx scripts/[script-name].ts
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Build Configuration

- **Target**: Vercel (free tier optimized)
- **Output**: Standalone build
- **Compression**: Enabled
- **Source maps**: Disabled in production
- **Console logs**: Removed in production
- **Server Actions**: 5MB body size limit

## Performance Optimizations

- Server Components by default (use 'use client' sparingly)
- Optimized package imports for lucide-react and Supabase
- React Strict Mode enabled
- Minimal client-side JavaScript
- Database indexes on all foreign keys
- RLS policies use indexed columns

## Deployment

- Primary: Vercel (automatic deployments from git)
- Database: Supabase cloud
- No additional infrastructure required
