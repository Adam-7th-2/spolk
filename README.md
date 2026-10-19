# Spolk

English learning academy built with Next.js, React, TypeScript, and Supabase PostgreSQL. Includes learner and staff workspaces, progress-based lessons, assignments and private attachments, quizzes, teacher conversations, notifications, and Traveller course integrations.

## Run locally

Use Node.js 24 and install the locked dependencies:

```sh
npm ci
npm run dev:local
```

The offline workspace opens at `http://127.0.0.1:3001`. See [local development](docs/LOCAL_DEVELOPMENT.md) for demo accounts, database persistence and optional services. Local accounts are disabled in production.

For hosted Supabase development, copy `apps/web/.env.example` to `apps/web/.env.local`, provide your project settings, and run `npm run dev`.

## Verify

```sh
npm run lint
npx next typegen apps/web
npm run typecheck
npm test
npm run build
```

The CI template in `.github/ci.yml.example` includes these checks and the public browser checks. The current GitHub login has repository access but lacks the `workflow` OAuth scope, so the template is inactive. After granting that scope, move it to `.github/workflows/ci.yml` to enable Actions. Authenticated local browser tests need the original private course assets described in [Traveller setup](docs/TRAVELLER_SETUP.md).

## Deploy the full LMS

This application needs a Node.js server. GitHub Pages cannot execute its authentication actions, protected API routes, assignment uploads, grading or notification workflows.

Configure the host to install with `npm ci`, build with `npm run build`, and start with `npm run start`. Provide the variables from `apps/web/.env.example` through the host's environment settings. Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS URL and configure the matching Supabase authentication redirects. `NEXT_PUBLIC_*` values must be available during the build. Apply the database migrations before exposing the hosted application, and use real hosted accounts; the offline database is not deployed or merged automatically.

The original course files are included in this private repository and Docker image. The default `render.yaml` uses a free web service and private Supabase Storage for student uploads, exam answers, and admin library additions, so those files survive ephemeral-server restarts. See [free hosting instructions](docs/HOSTING.md). A separate Docker Compose setup supports a persistent private volume on a managed server.

Notification email delivery requires a configured provider and a scheduled worker. See [student workspace and email setup](docs/STUDENT_WORKSPACE.md). Local Ollama and any live-class providers need separate production services and configuration.

## Files excluded from Git

- Environment files and credentials (the empty `.env.example` template is included).
- Runtime student answer uploads and homework attachments. Course books, audio, page images and test materials are now included in the private repository.
- The local database, backups and tools in `.tools/`.
- Installed dependencies, generated Next.js output and test reports.

The repository contains application code, schema migrations, course manifests and the supplied private course assets. It is not a backup of live student records or credentials.
