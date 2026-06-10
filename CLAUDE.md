# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A WhatsApp bot (using Baileys) that manages Telegram file downloads, archive compression/extraction, and file integrity checking. Uses clean/domain-driven architecture with a PostgreSQL database via Prisma.

## Key Commands

```bash
pnpm dev                # Start dev server with hot reload (tsx --watch ./src/infra/server)
pnpm test:unit          # Run unit tests (*.spec.ts)
pnpm test:e2e           # Run e2e tests (*.e2e.ts, sequential with global setup)
pnpm fix                # Auto-fix lint issues with Biome (unsafe writes)
docker compose up -d    # Start PostgreSQL database

# Prisma
npx prisma db push      # Sync schema to database
npx prisma migrate dev  # Create and apply migrations
npx prisma generate     # Regenerate Prisma client (output: ./generated/prisma)
```

## Architecture

### Clean Architecture Pattern

The codebase follows a layered domain-driven structure:

```
src/
  core/         # Shared primitives (Either monad, base entities)
  domain/       # Domain logic split by bounded context
    download/   # Telegram download use cases, services, subscribers
    notify/     # WhatsApp notification/file sending
    archives/   # Zip/rar compression and extraction
    checker/    # Archive reading and source validation
    chat/       # Chat-related services (fetch/manage downloads)
    shared/     # Cross-cutting concerns (progress stores, repo interfaces)
  events/       # EventDispatcher (pub/sub pattern for domain events)
  infra/        # Framework adapters
    whatsapp/   # Baileys connection + message listener + commands
    database/   # Prisma setup
    repositories/  # Concrete implementations of domain repository ports
```

### Key Dependencies

- **WhatsApp**: `@itsukichan/baileys` — handles bot connection via QR code auth (sessions stored in `./sessions-bot/`)
- **Telegram**: `tdl` + `telegram` — downloads files from Telegram
- **Database**: Prisma 7 + PostgreSQL (`@prisma/adapter-pg`)
- **Archives**: `archiver`, `unzipper`, `node-unrar-js` — zip/rar handling
- **Validation**: `zod` v4
- **Testing**: Vitest with two projects: `unit` (`*.spec.ts`) and `e2e` (`*.e2e.ts`)
- **Linting**: Biome 2

### Entry Point

`src/infra/server.ts` — creates WhatsApp connection, initializes the `Listener` with all dependencies wired up (repositories, services, event subscribers), then starts message handling.

### Event System

`EventDispatcher` in `src/events/` implements pub/sub. Domain subscribers (e.g., `OnDownloadRequested`, `OnSendFileRequested`) register handlers that fire when services dispatch events like downloads starting or completing.

### Either Pattern

`src/core/either/` — Standard Either<L, R> monad for error handling. Use `left(error)` for failures and `right(value)` for success.

### Path Alias

`@/*` maps to `./src/` in tsconfig.

### Command Registration

Commands in `src/infra/whatsapp/listener/messages/commands/` are auto-registered via `readdirSync` in `handle-main-commands.ts`. Each command must export a `CommandAdpter` class with a `name` property and `execute` method. Answer flows (button responses) live in `src/infra/whatsapp/listener/messages/answers/` and are also auto-registered via the same pattern.

## Changelog

- Added `CheckerSessionStore` (`src/domain/shared/checker/checker-session-store.ts`) — manages active checker and download sessions per jid with `AbortController`. Used for cancellation via `/stop`
- Changed `TelegramDownloadRepository` from `synchronous: true` to async polling loop — allows the event loop to process `AbortSignal` and call `cancelDownloadFile` on the TDLib client
- Added `signal?: AbortSignal` to `TelegramRepositoryDownload.downloadFromUri()` and `readArchiveAndCheckerRequest`
- Added `/stop` command — aborts active download or checker session via `CheckerSessionStore.abort(jid)`
- Added `/delete` command with two-step flow: `delete-response.ts` lists downloads as buttons → `delete-confirm.ts` asks confirmation ("Are you sure...") with Yes/Cancel buttons → deletes from DB and disk
- Added `deleteByFileName` to `DownloadsRepository` interface and `PrismaRepositoryDownloads`

## Important Notes

- `UniqueEntityId.toString` is a **getter**, not a method. Use `downloadId.toString`, NOT `downloadId.toString()`
- In-memory downloads are not cleaned up when a download is stopped — the `synchronous: false` change means the polling loop detects abort every 500ms
