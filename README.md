# Sigma Games — web apps

TypeScript monorepo of **Sigma Games**, a web gaming platform with dice and
pincode games, player balances, payments, a referral program, promo codes and
real-time chat.

Developed between November 2023 and May 2025. For most of that time this
repository held the whole product — backend services, database schema and web
apps. In March 2025 the backend moved to .NET in
[`workspace-dotnet`](https://github.com/sigma-gaming/workspace-dotnet), and this
repository kept the client applications and the Telegram bot, which now talk to
the .NET services through generated OpenAPI clients.

> **Status:** archived. The project is no longer maintained and its production
> infrastructure has been shut down. Local configuration and credentials were
> removed from the git history before the repository was made public; replaced
> values appear as `SECRET_REMOVED`.

## Applications

| App | What it is | Built with |
|---|---|---|
| [`apps/games-app`](apps/games-app) | Player web app: dice and pincode games, deposits, bonuses, affiliate program, chat, game history. Installable as a PWA | React, Effector, Farfetched, atomic-router, Mantine, Framer Motion, Rive, SignalR, Vite |
| [`apps/control-app`](apps/control-app) | Admin panel: dashboard, promo codes, notifications, maintenance mode | React, Effector, atomic-router, Mantine |
| [`apps/letsauth-app`](apps/letsauth-app) | Sign-in pages of the Let's Auth service (Telegram login) | Astro, Node adapter |
| [`apps/maintenance-app`](apps/maintenance-app) | Maintenance page served while the platform is down | React, Mantine |
| [`apps/games-bot`](apps/games-bot) | Telegram bot: start links with referral campaigns, webhook server | grammY, Hono |

Shared packages:

- `core/client` — Effector factories around API calls: statuses, error handling, notifications, modals
- `core/ui` — design system on top of Mantine: colors, typography, inputs, animations, icons
- `core/forms`, `core/utils`, `core/exceptions` — form helpers, small utilities, typed exceptions
- `games-libs/model` — domain types shared between apps
- `tooling/env`, `tooling/env-vite-plugin` — typed environment loading for Node and Vite
- `tooling/build` — build helpers for libraries
- `testing/load-tests` — load scenarios for k6 and Artillery

API clients are generated with [Orval](https://orval.dev) from the OpenAPI
specifications in [`openapi/`](openapi), which are exported by the .NET services.

## Earlier backend (in history)

Until [`398b8c4e`](https://github.com/sigma-gaming/workspace/commit/398b8c4e) (March 2025)
the repository also contained the TypeScript backend: `games-api`, `games-ws`,
`games-tasks`, `payment-api`, `access-api`, `control-api` and a database migration
app, built on

- Hono with TypeBox validation, uWebSockets.js and Socket.IO for real-time traffic
- PostgreSQL with Drizzle ORM, Redis (ioredis, Redlock, Socket.IO Redis adapter)
- a small dependency-injection container with graceful shutdown (`core/di`)
- cron-based background jobs, Prometheus metrics, Sentry

Browse it with `git log -- apps/games-api` or check out any commit before March 2025.
Release tags such as `@apps/games-api@0.0.12` come from that period, when services
were versioned with Changesets.

## Getting started

Requirements: Node.js 22.14, pnpm 10 (see [`.prototools`](.prototools)),
[mkcert](https://github.com/FiloSottile/mkcert).

```bash
pnpm install
pnpm openapi:generate      # generate API clients from openapi/*.json
pnpm cert:generate         # local HTTPS certificates, see ssl/README.md
cp .env.development.example .env.development

pnpm typecheck
pnpm build
pnpm dev:games             # needs the .NET backend running
```

## Tooling

Nx and pnpm workspaces, TypeScript 5.7, Vite, Vitest, ESLint and Prettier, Sentry
for error tracking, a multi-target Dockerfile (one image per app), and GitHub
Actions that type-check, lint, test and build only the projects affected by a
change.

## Related repositories

- [`workspace-dotnet`](https://github.com/sigma-gaming/workspace-dotnet) — backend services (.NET 9)
- [`k8s`](https://github.com/sigma-gaming/k8s) — Kubernetes manifests delivered with Flux CD
- [`infra`](https://github.com/sigma-gaming/infra) — cluster and cloud resources in Pulumi

## Author

Evgenii Zakharov ([@risenxxx](https://github.com/risenxxx))
