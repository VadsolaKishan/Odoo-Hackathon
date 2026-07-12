
# Drive Link

(Add your project drive link here)

# Team Members

| Name              | Email                                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| Kishan Vadsola    | [vadsolakishan1310@gmail.com](mailto:vadsolakishan1310@gmail.com)           |
| Darshan Thummar   | [darshantce.059@gmail.com](mailto:darshantce.059@gmail.com)                 |
| Shreeja Upadhyay  | [shreejaupadhyaycspitce@gmail.com](mailto:shreejaupadhyaycspitce@gmail.com) |
| Dhruvin Vaghasiya | [dhruvinvaghasiya.dev@gmail.com](mailto:dhruvinvaghasiya.dev@gmail.com)     |

---

# Problem Statement

# TransitOps — Smart Transport Operations Platform

TransitOps is a centralized web platform that digitizes the day-to-day operations of a transport/logistics company — vehicle registry, driver management, trip dispatching, maintenance, fuel & expense tracking, and analytics — replacing spreadsheets and manual logbooks with a single system that enforces business rules and gives real-time operational visibility.

Built for the **Odoo Hackathon 2026** (8-hour build).

---

## Problem Statement

Logistics companies that rely on spreadsheets and manual logbooks run into scheduling conflicts, underutilized vehicles, missed maintenance, expired driver licenses, inaccurate expense tracking, and poor visibility into operations.

TransitOps solves this by managing the complete lifecycle of transport operations — from registering a vehicle to dispatching it on a trip, tracking maintenance, logging fuel/expenses, and reporting on cost and utilization — while automatically enforcing the rules that keep that data trustworthy (no double-booking, no overloading a vehicle, no dispatching a suspended driver, etc.).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, TanStack Start / TanStack Router, Vite, Tailwind CSS, Radix UI (shadcn/ui components) |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL, via Prisma ORM |
| Auth | JWT-based login with role selection, brute-force lockout after failed attempts |
| Validation | Zod (backend request validation) |
| Testing | Vitest, Supertest |

---

## Project Structure

```
Odoo-Hackathon/
├── Front-end/                  # React + TanStack Start client
│   └── src/
│       ├── routes/             # One file per page (dashboard, fleet, drivers, trips, maintenance, expenses, analytics, settings, auth)
│       ├── context/             # AuthContext (login, roles, RBAC), StoreContext (shared app state)
│       ├── components/          # Layout + reusable UI components (shadcn/ui based)
│       ├── lib/                 # API client, utilities
│       └── types/                # Shared TypeScript types
│
└── backend/                    # Express + Prisma API
    ├── prisma/
    │   └── schema.prisma        # Database schema (Users, Vehicles, Drivers, Trips, Maintenance, Fuel Logs, Expenses, Settings)
    └── src/
        ├── features/            # One folder per module: auth, vehicles, drivers, trips, maintenance, fuelLogs, expenses, settings
        ├── middleware/           # Auth/role guards
        ├── config/, db/, utils/, shared/
        └── server.ts
```

---

## Core Modules

1. **Authentication (RBAC)** — Email + password login with a role selector (Fleet Manager / Dispatcher / Safety Officer / Financial Analyst). Account locks for 5 minutes after 3 failed attempts.
2. **Dashboard** — Live KPIs: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers on Duty, Fleet Utilization %. Filterable by vehicle type, status, and region.
3. **Vehicle Registry (Fleet)** — Master list of vehicles: unique registration number, name/model, type, load capacity, odometer, acquisition cost, status (`Available`, `On Trip`, `In Shop`, `Retired`).
4. **Drivers & Safety Profiles** — Driver name, license number, license category, expiry date, contact, safety score, status (`Available`, `On Trip`, `Off Duty`, `Suspended`).
5. **Trip Dispatcher** — Create a trip (source, destination, vehicle, driver, cargo weight, distance). Lifecycle: `Draft → Dispatched → Completed → Cancelled`.
6. **Maintenance** — Log service records against a vehicle. An active maintenance record automatically moves the vehicle to `In Shop` and removes it from the dispatch pool.
7. **Fuel & Expense Management** — Log fuel (liters, cost, date) and other expenses (toll, repair, misc). Total operational cost per vehicle is computed automatically (Fuel + Maintenance).
8. **Reports & Analytics** — Fuel Efficiency (distance/fuel), Fleet Utilization, Operational Cost, and Vehicle ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost. Monthly revenue chart and top costliest vehicles.
9. **Settings & RBAC** — Depot name, currency, distance unit, and a read-only view of the role-permission matrix.

---

## Business Rules Enforced

- Vehicle registration number must be unique.
- `Retired` or `In Shop` vehicles never appear in the dispatch selection.
- Drivers with an expired license or `Suspended` status cannot be assigned to a trip.
- A vehicle or driver already `On Trip` cannot be assigned to another trip.
- Cargo weight must not exceed the vehicle's maximum load capacity.
- Dispatching a trip sets both vehicle and driver status to `On Trip`.
- Completing a trip resets both vehicle and driver status to `Available`.
- Cancelling a dispatched trip restores vehicle and driver to `Available`.
- Creating an active maintenance record sets the vehicle to `In Shop`.
- Closing maintenance restores the vehicle to `Available` (unless it's retired).

---

## Roles & Permissions (RBAC)

Each role sees the same navigation, but every module is scoped to one of: **Manage** (full control), **Edit** (can add/update, not the module owner), **View**/**Read Only** (look only, no changes).

| Module | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Fleet (Vehicles) | Manage | View | View | Read Only |
| Drivers | Manage | Edit | Manage | Read Only |
| Trips | View | Manage | View | Read Only |
| Fuel & Expenses | Edit | Edit | Read Only | Manage |
| Analytics / Reports | View | View | View | Manage |

- **Fleet Manager** — owns the vehicle registry and driver records; can log fuel/expenses; view-only on trips and analytics.
- **Dispatcher** — owns trip creation and dispatching; can edit driver info and log fuel; view-only on the vehicle list.
- **Safety Officer** — owns driver compliance (license, safety score, suspension); read/view-only everywhere else.
- **Financial Analyst** — owns fuel/expense records and analytics/reports; read-only on fleet, drivers, and trips.

---

## Database Entities

`User`, `Vehicle`, `Driver`, `Trip`, `MaintenanceRecord`, `FuelLog`, `Expense`, `Setting` — modeled in `backend/prisma/schema.prisma` with enums for `UserRole`, `VehicleType`, `VehicleStatus`, `DriverCategory`, `DriverStatus`, `TripStatus`, and `MaintenanceStatus`.

---

## Getting Started

### Backend
```bash
cd backend
npm install
# Set DATABASE_URL and DIRECT_URL in a .env file (PostgreSQL)
npx prisma migrate dev
npm run dev        # starts the API (default: http://localhost:4000)
```

### Frontend
```bash
cd Front-end
npm install         # or bun install
npm run dev         # starts the Vite dev server
```

---

## Example Workflow

1. Register vehicle `VAN-05` — max capacity 500 kg, status `Available`.
2. Register driver `Alex` with a valid license.
3. Create a trip with cargo weight 450 kg — system checks 450 ≤ 500 and allows dispatch.
4. Vehicle and driver both flip to `On Trip`.
5. Complete the trip (enter final odometer, fuel consumed) — both flip back to `Available`.
6. Log a maintenance record (e.g. Oil Change) — vehicle status becomes `In Shop`, hidden from dispatch.
7. Reports & Analytics update automatically based on the latest trip and fuel log.

---

## Bonus / Future Enhancements
- PDF export for reports (CSV export is already supported)
- Email reminders for expiring driver licenses
- Vehicle document management (RC, insurance, permits)
- Dark mode
- Extending RBAC enforcement to the Maintenance and Settings modules (currently open to all authenticated users; recommended: Fleet Manager = Manage, others = Read Only)

---

## Team
Built for the Odoo Hackathon 2026 — Repository: [VadsolaKishan/Odoo-Hackathon](https://github.com/VadsolaKishan/Odoo-Hackathon)



---

