---
inclusion: always
---

# Project Structure

## Directory Organization

```
jaspel-kpi-system/
├── app/                    # Next.js App Router (routes & pages)
├── components/             # React components
├── lib/                    # Core libraries & utilities
├── services/               # Business logic layer
├── supabase/              # Database schemas & migrations
├── scripts/               # Utility scripts (setup, testing, fixes)
└── [config files]         # Root configuration files
```

## App Directory (Routes)

```
app/
├── admin/                 # Superadmin routes
│   ├── dashboard/        # Main admin dashboard
│   ├── units/            # Unit management
│   ├── users/            # User management
│   ├── kpi-config/       # KPI structure configuration
│   ├── pool/             # Pool management
│   ├── reports/          # Report generation
│   ├── audit/            # Audit logs
│   └── settings/         # System settings
├── manager/              # Unit Manager routes
│   ├── dashboard/        # Manager dashboard
│   └── realization/      # KPI realization input
├── employee/             # Employee routes
│   └── dashboard/        # Employee dashboard
├── api/                  # API routes (minimal - prefer Server Actions)
│   ├── audit/
│   ├── import/
│   ├── notifications/
│   ├── reports/
│   └── settings/
├── login/                # Login page
├── profile/              # User profile
├── reset-password/       # Password reset
├── forbidden/            # Access denied page
├── notifications/        # Notifications page
├── layout.tsx            # Root layout
├── page.tsx              # Home/redirect page
├── globals.css           # Global styles
├── error.tsx             # Error boundary
└── loading.tsx           # Loading state
```

## Components Directory

```
components/
├── kpi/                  # KPI-related components
│   ├── KPITree.tsx
│   ├── CategoryFormDialog.tsx
│   ├── IndicatorFormDialog.tsx
│   └── CopyStructureDialog.tsx
├── pool/                 # Pool management components
│   ├── PoolTable.tsx
│   ├── PoolFormDialog.tsx
│   └── PoolDetailsDialog.tsx
├── units/                # Unit management components
│   ├── UnitTable.tsx
│   ├── UnitFormDialog.tsx
│   └── DeleteUnitDialog.tsx
├── users/                # User management components
│   ├── UserTable.tsx
│   └── UserFormDialog.tsx
├── realization/          # Realization input components
│   └── RealizationForm.tsx
├── navigation/           # Navigation components
│   └── Sidebar.tsx
├── layout/               # Layout components
│   └── Footer.tsx
└── ui/                   # Shadcn UI components (DO NOT MODIFY)
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── label.tsx
    ├── table.tsx
    ├── tabs.tsx
    └── [other shadcn components]
```

## Lib Directory (Core Logic)

```
lib/
├── formulas/
│   └── kpi-calculator.ts      # Core KPI calculation logic (Decimal.js)
├── export/
│   ├── excel-export.ts        # Excel generation
│   └── pdf-export.ts          # PDF generation
├── hooks/
│   ├── useAuth.ts             # Authentication hook
│   ├── useDataCache.ts        # Data caching hook
│   └── useSearchFilter.ts     # Search/filter hook
├── services/
│   ├── auth.service.ts        # Authentication service
│   ├── user.service.ts        # User management
│   ├── rbac.service.ts        # Role-based access control
│   ├── password.service.ts    # Password management
│   ├── audit.service.ts       # Audit logging
│   ├── notification.service.ts # Notifications
│   └── settings.service.ts    # System settings
├── supabase/
│   ├── client.ts              # Browser Supabase client
│   └── server.ts              # Server Supabase client
├── types/
│   └── database.types.ts      # TypeScript database types
├── utils/
│   └── performance.ts         # Performance utilities
└── utils.ts                   # General utilities (cn, etc.)
```

## Services Directory

```
services/
└── calculation.service.ts     # Main calculation engine
```

## Supabase Directory

```
supabase/
├── schema.sql                 # Full database schema + RLS policies
├── seed.sql                   # Sample data for testing
├── setup-superadmin.sql       # Superadmin setup
└── migrations/                # Database migrations
    ├── add_audit_and_notifications.sql
    ├── add_calculation_log.sql
    └── add_footer_setting.sql
```

## Scripts Directory

Utility scripts for setup, testing, and troubleshooting:
- `setup-auth.ts`: Create superadmin user
- `test-*.ts`: Various testing scripts
- `fix-*.ps1`: PowerShell fix scripts
- `verify-*.ts`: Verification scripts

## Key Files

- `middleware.ts`: Supabase auth middleware (handles session refresh)
- `next.config.js`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `.env.local`: Environment variables (not in git)

## Naming Conventions

- **Components**: PascalCase (e.g., `UserTable.tsx`)
- **Utilities**: camelCase (e.g., `kpi-calculator.ts`)
- **Services**: kebab-case with `.service.ts` suffix
- **Types**: PascalCase interfaces/types
- **Database tables**: snake_case with prefix (`m_` for master, `t_` for transaction)

## Import Aliases

Use `@/` for absolute imports from project root:
```typescript
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
```

## File Placement Rules

- Server Components: Default in `app/` directory
- Client Components: Add `'use client'` directive at top
- Server Actions: Can be in same file or separate `actions.ts`
- Shared utilities: `lib/` directory
- Business logic: `services/` directory
- UI components: `components/` directory
