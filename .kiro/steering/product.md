---
inclusion: always
---

# Product Overview

JASPEL is an enterprise-grade incentive and KPI management system for Indonesian organizations. The system manages employee performance tracking and incentive distribution using a three-tier KPI framework (P1, P2, P3).

## Core Purpose

Calculate and distribute employee incentives based on:
- P1 (Position): Job description-based indicators
- P2 (Performance): Output/result-based targets
- P3 (Potential/Behavior): Competency and behavior indicators

## User Roles

1. **Superadmin**: Full system access, manages master data, pool configuration, and runs calculations
2. **Unit Manager**: Inputs KPI realization data for employees in their unit only (data isolation enforced)
3. **Employee**: Views personal dashboard and downloads incentive slips

## Key Features

- Row Level Security (RLS) for strict data isolation between units
- High-precision financial calculations using Decimal.js
- Automatic PPh 21 (Indonesian tax) calculation
- Excel import/export for bulk operations
- PDF slip generation with detailed breakdowns
- Real-time dashboard with performance visualizations

## Business Flow

1. Superadmin configures KPI structure and creates monthly pool
2. Unit Managers input employee realization data
3. System calculates scores and distributes incentives proportionally
4. Employees view results and download slips

## Critical Constraints

- All financial calculations must use Decimal.js (never native JavaScript numbers)
- RLS policies must be maintained - never bypass security
- Data isolation between units is mandatory
- System is optimized for Vercel free tier deployment
