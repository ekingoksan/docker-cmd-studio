# Docker Cmd Studio

Generate and manage reproducible `docker run` commands from a friendly web UI.  
Store configurations in MySQL, duplicate/edit later, and copy the final command to run over SSH.

---

## ✨ Features

- **Authentication**
  - NextAuth (JWT) login/logout
  - Protected routes
- **Container Configs**
  - Create / List / Edit / Delete
  - Server-side **search + pagination**
  - **Duplicate** configs, **Regenerate** docker run
  - **Copy** to clipboard
- **Command Builder** supports:
  - `--restart`, `--network`, `-p` ports (with/without host), `--add-host`
  - `-e` environment variables, `--label`
  - `-v` volumes (`ro` / `rw`)
  - extra args
- **Profile**
  - Update name & email
  - Optional password update (new + confirm)
  - Show/Hide password, **Generate** strong password, **Copy**
  - Friendly error messages (banner + field-level)
- **Tech stack**
  - Next.js 15 (App Router) + TypeScript
  - Tailwind CSS
  - Prisma ORM + MySQL
  - NextAuth (JWT)
  - Zod validation
  - bcrypt
  - lucide-react icons
- **Database**
  - UUID primary keys

---

## 🧱 Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS, lucide-react
- **Auth**: NextAuth (JWT strategy)
- **Database**: MySQL with Prisma ORM
- **Validation**: Zod
- **Package manager**: pnpm

---


## ⚙️ Setup

1. Clone & install  
   ```bash
   pnpm install
   ```

2. Environment (`.env`)  
   ```bash
   # Database
   DATABASE_URL="mysql://user:pass@localhost:3306/docker_cmd_studio"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="a-long-random-secret"
   ```

   > You must set `NEXTAUTH_SECRET`. In production, use a strong random value.

3. Database & Prisma  
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev --name init
   pnpm ts-node prisma/seed.ts
   ```

4. Start dev server  
   ```bash
   pnpm dev
   # http://localhost:3000
   ```

---

## 🔐 Authentication

- Uses **NextAuth (JWT)**.
- API routes use `getToken({ req, secret: process.env.NEXTAUTH_SECRET })`.
- Profile update can also update password when `passwordNew` and `passwordConfirm` match and are ≥ 6 characters.

---

## 🧩 API Overview

- `GET /api/configs?q=&page=&pageSize=` — list with search & pagination
- `POST /api/configs` — create config
- `GET /api/configs/:id` — fetch single config
- `PUT /api/configs/:id` — update config
- `DELETE /api/configs/:id` — delete config
- `POST /api/configs/:id/generate` — regenerate docker run command
- `POST /api/configs/:id/duplicate` — duplicate config
- `GET /api/profile` — get current user profile
- `PUT /api/profile` — update profile (optional password update)

Example docker run output:

```bash
docker run -d   --name myapp   --restart always   -p 8080:80   --add-host=my.host.internal:10.0.0.2   -e "DATABASE_URL=mysql://user:pass@host:3306/db"   --label com.example.key=value   -v /host/path:/container/path:rw   user/image:latest
```

---

## 🛡️ Validation & Errors

- **Server-side**: Zod schemas  
- **Client-side**: password validation  
- **UI**:
  - Banner with top-level error/info
  - Field-level messages (red borders, helper texts)

---

## 🌗 UI/UX

- Sidebar navigation: Lists, New Command, Profile  
- Lists page: search, pagination, table actions (Edit, Delete, Duplicate, Copy)  
- Profile page: Generate secure password, Show/Hide, Copy

---

## 🚀 Roadmap

- Role-based permissions (admin vs user)
- Container health/status checks (Docker Remote API)
- Export/Import configs (JSON/YAML)
- Audit logs
- Theme switch (light/dark)
=======