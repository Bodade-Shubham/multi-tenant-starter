# 🏢 Multi-Tenant Starter

A full-stack **Fastify + MongoDB + Angular** boilerplate for building **multi-tenant SaaS applications** with **user management, authentication, and role-based access control (RBAC)**.  
It provides a ready-to-use backend API and frontend admin portal to help developers quickly launch scalable, tenant-aware platforms for institutes, organizations, or clients — all from a single codebase.

---

## 🚀 Tech Stack

**Backend (API)**
- [Fastify](https://fastify.dev/) — High-performance Node.js framework
- [MongoDB](https://www.mongodb.com/) — NoSQL database with tenant-scoped collections
- [TypeScript](https://www.typescriptlang.org/) — Strongly typed development
- [JWT](https://jwt.io/) — Secure authentication (access + refresh tokens)
- [argon2/bcrypt](https://www.npmjs.com/package/argon2) — Password hashing
- Zod (validation) + Dotenv + Fastify plugins (CORS, Rate limit)

**Frontend (Web)**
- [Angular 17+](https://angular.dev/) — Modern reactive frontend
- [TailwindCSS](https://tailwindcss.com/) — Utility-first UI styling
- Angular Router + Guards for role-based navigation
- Optional NgRx / Signal-based state management

**DevOps**
- Docker + docker-compose for local setup  
- `.env` configuration for environment management  
- Optional GitHub Actions CI/CD  

---

## 🧩 Features

✅ Multi-tenant architecture (organization/institute isolation)  
✅ Role-based access control (RBAC) with permissions  
✅ User authentication and invite system  
✅ JWT-based auth with refresh token rotation  
✅ Tenant-aware CRUD APIs  
✅ Angular Admin Dashboard with role management  
✅ Shared DTOs between backend and frontend (monorepo ready)  
✅ Extensible module structure — easily add more entities  
✅ Ready for SaaS, enterprise, and educational platforms  

---

🧠 Ideal Use Cases

🏢 SaaS Platforms — Apps needing per-organization data isolation and roles

🎓 Institute / School Management — Manage users, staff, and students per institute

💼 Enterprise Tools — Internal company dashboards with department-level access

🧮 HRMS / CRM Systems — Multi-branch or multi-client business applications

⚙️ Developer Starter Kit — A boilerplate for quickly bootstrapping new projects with tenant-aware APIs and UI



---

## 🔐 Seed Data & Super Admin

The backend includes an idempotent seed to provision core master data and a super admin account.

- **Run the seed**: `cd api && npm run seed:master-data`  
  - Upserts permissions, roles, designations, organisations, and the initial super admin user.  
  - Generates clipboard-friendly mongo shell scripts at `seed/master-data.mongo.js` and `seed/master-data.mongo.txt`.
- **Default Super Admin**
  - Email: `superadmin@multi-tenant.local`  
  - Password: `ChangeMeNow!123` (bcrypt hashed during seeding)  
  - Organisation: `Super Admin Organisation`  
  - Role: `super-admin` (system scope, full access)  
  - Designation: `Super Administrator`
- **Collections ensured**: `permissions`, `roles`, `designations`, `tenants`, `users`
- **Idempotent**: re-running the seed fixes drift without creating duplicates or stale references.
- **Manual alternative**: copy `seed/seed_mongo_script.txt` into `mongosh` if the TypeScript toolchain is unavailable.

> ⚠️ For production, rotate the seeded password and update secrets immediately after bootstrapping.

---
