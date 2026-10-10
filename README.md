# LinkVault

Personal link/bookmark management REST API.

**Stack:** Node.js · TypeScript (strict) · Express 5 · PostgreSQL · Prisma 6 · JWT · bcrypt · Zod · tsx

## Links

| | |
|---|---|
| Live API | https://linkvault-api-xy7m.onrender.com |
| API docs (Swagger UI) | https://linkvault-api-xy7m.onrender.com/api/docs |
| Health check | https://linkvault-api-xy7m.onrender.com/health |
| Source code | https://github.com/BlackSnow74/LinkVault |

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

Status codes: `400` invalid input · `401` not authenticated · `404` not found · `409` conflict · `429` rate limited · `500` server error.

## API surface (Phases 1–4)

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register` | no |
| POST | `/api/auth/login` | no |
| GET | `/api/auth/me` | yes |
| GET/POST | `/api/links` | yes |
| GET/PATCH/DELETE | `/api/links/:id` | yes |
| PUT | `/api/links/:id/tags` | yes |
| GET | `/api/links?search=&tag=&collection=&page=&limit=` | yes |
| GET/POST | `/api/collections` | yes |
| GET | `/api/collections/:id` | public if `PUBLIC` |
| PATCH/DELETE | `/api/collections/:id` | owner only |

## API docs

Interactive Swagger UI at `/api/docs`, raw OpenAPI spec at `/api/openapi.json`.

## Testing

| Command | Purpose |
|---|---|
| `npm test` | Run the full suite once |
| `npm run test:watch` | Re-run on change |
| `npm run test:coverage` | With coverage report |

Tests run against a **separate** database. Copy `.env.test.example` to `.env.test` and set `TEST_DATABASE_URL`, then create the schema once:

```bash
npx prisma db push --skip-generate   # against the test database
```

The suite refuses to run unless `TEST_DATABASE_URL` contains "test", so it can never touch your development data.

## Deployment (Render)

`render.yaml` declares a Node web service plus a managed PostgreSQL database. Pushing it to GitHub and creating a Blueprint on Render provisions both. Secrets come from Render's environment (`JWT_SECRET` is generated), never from a committed file.

Build runs `npm ci && npm run build && npx prisma migrate deploy`, so migrations apply on every deploy. Health checks hit `/health`.

Set `CORS_ORIGIN` to your frontend's origin in production rather than leaving it open.

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
