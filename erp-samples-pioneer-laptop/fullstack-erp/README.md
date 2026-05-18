# ManufactureOS — Full Stack ERP

A production-ready Manufacturing ERP built with React, Node.js, Express, Prisma, and PostgreSQL.

---

## 🗂 Project Structure

```
erp/
├── apps/
│   ├── web/               ← React + Vite frontend (port 5173)
│   └── api/               ← Express + Prisma backend (port 3001)
├── packages/
│   └── shared/            ← Shared types & utilities
├── docker-compose.yml     ← PostgreSQL + Redis
└── package.json           ← Monorepo root
```

## 📦 Modules

| Module | Features |
|---|---|
| **Inventory** | Products, SKUs, categories, warehouses, locations, stock levels, stock moves |
| **Sales & CRM** | Customers, contacts, sale orders, order lifecycle |
| **Purchasing** | Vendors, purchase orders, goods receipts, RFQs |
| **Finance** | Chart of accounts, journals, invoices, payments, vendor bills |
| **HR & Payroll** | Employees, departments, attendance, leave, payroll runs |
| **Production** | Bills of materials, work orders, work centers, MRP |

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 9+

### 2. Start the database

```bash
docker-compose up -d
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure the API environment

```bash
cd apps/api
cp .env.example .env
# Edit .env if needed (defaults work with docker-compose)
```

### 5. Run migrations & seed

```bash
npm run db:migrate     # Creates all tables
npm run db:seed        # Seeds demo data
```

### 6. Start development servers

```bash
# From repo root — starts both API and web concurrently
npm run dev
```

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **Prisma Studio**: `npm run db:studio`

### Default credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@erp.local | admin123! |
| Manager | manager@erp.local | manager123! |

---

## 🔐 Auth & Roles

JWT-based auth with RBAC. Available roles:

`SUPER_ADMIN` › `ADMIN` › `MANAGER` › `ACCOUNTANT` / `WAREHOUSE_STAFF` / `SALES_REP` / `PURCHASING_OFFICER` / `HR_STAFF` / `PRODUCTION_SUPERVISOR` › `VIEWER`

### API Auth

```
POST /api/auth/login        → returns token + refreshToken
POST /api/auth/refresh      → rotate tokens
GET  /api/auth/me           → current user (requires Bearer token)
```

All protected routes require:
```
Authorization: Bearer <token>
```

---

## 📡 API Reference

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | login, refresh, me, change-password |
| Dashboard | `/api/dashboard` | kpis, recent-orders, revenue-chart |
| Inventory | `/api/inventory` | products, categories, warehouses, stock-moves, uoms |
| Sales | `/api/sales` | customers, orders |
| Purchasing | `/api/purchasing` | vendors, orders |
| Finance | `/api/finance` | accounts, journals, invoices |
| HR | `/api/hr` | employees, departments, payroll-runs |
| Production | `/api/production` | boms, work-orders, work-centers |

All list endpoints support: `?page=1&limit=20&search=...`

Response format:
```json
{ "success": true, "data": [...], "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 } }
```

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| UI Components | Radix UI primitives + custom components |
| State | Zustand (auth) + TanStack Query (server state) |
| Charts | Recharts |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Logging | Winston + Morgan |

---

## 🗄 Database Schema

Key models and their relationships:

```
User ──────────── Employee (1:1)
Customer ─────── SaleOrder ──── SaleOrderLine ──── Product
Vendor ──────── PurchaseOrder ── PurchaseOrderLine ── Product
Invoice ────── Customer, SaleOrder
BillOfMaterial ── BomLine ──── Product
WorkOrder ───── BillOfMaterial, WorkCenter
PayrollRun ──── PayrollLine ──── Employee
```

---

## 🔧 Phase Roadmap

- [x] **Phase 1** — Foundation: auth, schema, API shell, UI shell, all module pages
- [ ] **Phase 2** — Inventory deep-dive: stock moves, replenishment alerts, batch ops
- [ ] **Phase 3** — Sales: order forms, delivery tracking, invoicing workflow
- [ ] **Phase 4** — Purchasing: PO forms, GRN, 3-way matching
- [ ] **Phase 5** — Finance: journal entries, AP/AR aging, financial statements
- [ ] **Phase 6** — HR: attendance tracking, leave management, payroll computation
- [ ] **Phase 7** — Production: MRP planning, work order scheduling, capacity planning

---

## 📁 Adding a new module

1. Add models to `apps/api/prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Add routes in `apps/api/src/routes/`
4. Add page components in `apps/web/src/pages/`
5. Register routes in `apps/api/src/index.ts`
6. Add nav item in `apps/web/src/components/layout/AppLayout.tsx`
