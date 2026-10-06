# LinkVault

Personal link/bookmark management REST API.

**Stack:** Node.js · TypeScript (strict) · Express 5 · PostgreSQL · Prisma 6 · JWT (Phase 2) · bcrypt (Phase 2) · Zod · tsx

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env -> set DATABASE_URL to your PostgreSQL database

# 3. Apply migrations
npx prisma migrate dev

# 4. Run the dev server (hot reload)
npm run dev
```

Server runs on `http://localhost:3000` by default (`PORT` env var to override).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |
| `npm run db:studio` | Open Prisma Studio |
| `npx prisma migrate dev` | Apply migrations in dev |

## API (Phase 1)

| Method | Path | Auth | Description | Success |
|---|---|---|---|---|
| GET | `/health` | no | Health check | 200 |
| POST | `/api/links` | no | Create a link | 201 |
| GET | `/api/links` | no | List all links | 200 |
| GET | `/api/links/:id` | no | Get one link | 200 |
| PATCH | `/api/links/:id` | no | Update provided fields only | 200 |
| DELETE | `/api/links/:id` | no | Delete a link | 204 |

### Create/update body

```json
{ "title": "Node docs", "url": "https://nodejs.org", "description": "optional" }
```

`PATCH` accepts any subset of fields, but at least one is required.

### Error format

```json
{ "error": "message" }
```

Status codes: `400` invalid input · `404` not found · `500` server error.

## Project structure

```
src/
├── app.ts / server.ts      # app assembly / listen
├── routes/                 # route definitions only
├── controllers/            # request/response handling
├── services/               # business logic + DB calls
├── middleware/             # validate, errorHandler, notFound
├── schemas/                # Zod validation schemas
├── lib/prisma.ts           # PrismaClient singleton
└── utils/AppError.ts
```

## Environment

`.env` is git-ignored — never commit real secrets. See `.env.example` for the required keys.
