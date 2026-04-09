# Generation Task Manager

A full-stack task management application with real-time updates, full-text search, and a CDC (Change Data Capture) pipeline that synchronizes PostgreSQL with Elasticsearch.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Next.js    │────▶│  PostgreSQL   │────▶│  CDC Triggers    │
│  (App Router)│     │   (Primary)   │     │  LISTEN/NOTIFY   │
└──────┬───────┘     └──────────────┘     └────────┬─────────┘
       │                                           │
       │  SSE                              ┌───────▼────────┐
       │◀──────────────────────────────────│   CDC Worker    │
       │                                   │  (Node process) │
       │                                   └───────┬────────┘
       │                                           │ Bulk Index
       │             ┌──────────────┐              │
       │────────────▶│Elasticsearch │◀─────────────┘
       │  Search     │  (Search +   │
       │  Analytics  │  Analytics)  │
       └─────────────└──────────────┘
```

**Data flows two ways:**
1. **Writes** go to PostgreSQL, which fires CDC triggers that notify the CDC worker to index changes into Elasticsearch.
2. **Reads** for search and analytics query Elasticsearch directly; standard CRUD reads go to PostgreSQL.
3. **Real-time** updates are broadcast via SSE — the Next.js server LISTENs on the same PG notification channel and pushes events to connected clients.

## Key Features

- **JWT Authentication** — HTTP-only cookies, bcrypt (12 rounds), timing-safe login
- **Role-Based Access Control** — Admin and user roles with granular permissions
- **CDC Pipeline** — PG triggers + LISTEN/NOTIFY to a Node worker that bulk-indexes into Elasticsearch
- **Full-Text Search** — Fuzzy matching, field boosting, and hit highlighting via Elasticsearch
- **Real-Time Updates** — Server-Sent Events for live task changes and pipeline monitoring
- **Analytics Dashboard** — Aggregations (status/priority breakdowns, overdue counts, trends) from Elasticsearch
- **Rate Limiting** — Per-IP rate limiting on auth endpoints

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Framework     | Next.js 16 (App Router, RSC)        |
| Language      | TypeScript 5                        |
| Styling       | Tailwind CSS 4                      |
| Database      | PostgreSQL 16                       |
| Search        | Elasticsearch 8                     |
| Auth          | JWT (`jose`) + bcrypt               |
| Validation    | Zod 4                               |
| Real-time     | Server-Sent Events (ReadableStream) |
| Charts        | Recharts                            |
| Logging       | Pino                                |
| Testing       | Vitest 4, Playwright                |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm

### 1. Clone and install

```bash
git clone <repo-url>
cd generation-task-manager
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL 16 and Elasticsearch 8. Kibana is available under the `debug` profile (`docker compose --profile debug up -d`).

### 3. Configure environment

```bash
cp .env.example .env
```

Update `JWT_SECRET` with a random string for production use.

### 4. Run migrations and seed

```bash
npm run db:migrate
npm run es:setup
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

### 6. Start the CDC worker (separate terminal)

```bash
npm run cdc:start
```

The app is now running at [http://localhost:3000](http://localhost:3000).

**Seed accounts:**
| Email              | Password  | Role  |
|--------------------|-----------|-------|
| admin@example.com  | admin123  | Admin |
| user@example.com   | user1234  | User  |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login and registration pages
│   ├── (dashboard)/         # Authenticated pages (tasks, analytics, pipeline, admin)
│   └── api/
│       ├── auth/            # Login, logout, register, session
│       ├── tasks/           # CRUD + search endpoints
│       ├── analytics/       # Elasticsearch aggregations
│       ├── admin/           # User management (admin only)
│       └── sse/             # SSE endpoints (tasks, pipeline)
├── components/              # React components (task list, search, charts, etc.)
├── hooks/                   # Client hooks (useAuth, useTasks, useSSE)
└── lib/
    ├── auth/                # Session, RBAC, rate limiting, password hashing
    ├── cdc/                 # CDC listener, transformer, indexer, pipeline
    ├── db/                  # Connection pool, queries, SQL migrations
    ├── es/                  # Elasticsearch client, indices, search queries
    └── sse/                 # SSE hub (EventEmitter) and CDC relay
scripts/
├── migrate.ts               # Run SQL migrations
├── seed.ts                  # Seed demo data
├── setup-es.ts              # Create Elasticsearch index + mappings
└── cdc-worker.ts            # Standalone CDC worker process
```

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests (requires running PostgreSQL and Elasticsearch)
npm run test:integration

# End-to-end tests (requires running dev server)
npm run test:e2e

# All tests
npm run test
```

## API Overview

| Method | Endpoint               | Description                  | Auth     |
|--------|------------------------|------------------------------|----------|
| POST   | `/api/auth/register`   | Create account               | Public   |
| POST   | `/api/auth/login`      | Login                        | Public   |
| POST   | `/api/auth/logout`     | Logout                       | Auth     |
| GET    | `/api/auth/me`         | Current user                 | Auth     |
| GET    | `/api/tasks`           | List tasks                   | Auth     |
| POST   | `/api/tasks`           | Create task                  | Auth     |
| GET    | `/api/tasks/:id`       | Get task                     | Auth     |
| PUT    | `/api/tasks/:id`       | Update task                  | Auth     |
| DELETE | `/api/tasks/:id`       | Delete task                  | Auth     |
| GET    | `/api/tasks/search`    | Full-text search             | Auth     |
| GET    | `/api/analytics`       | Dashboard aggregations       | Auth     |
| GET    | `/api/admin/users`     | List users                   | Admin    |
| PUT    | `/api/admin/users/:id` | Update user role             | Admin    |
| GET    | `/api/sse/tasks`       | Task change stream           | Auth     |
| GET    | `/api/sse/pipeline`    | CDC pipeline event stream    | Admin    |
