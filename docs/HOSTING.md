# Hosting the full academy

The private GitHub repository now includes the original course files in `apps/web/private/books/` and `apps/web/private/library/`. They remain outside the public directory and are served through authenticated routes. Student uploads, the offline database, passwords and environment files are excluded from Git and the container build context.

The complete application needs a Node.js host and a reachable hosted Supabase project. GitHub Pages is not a host for this application. The included Docker configuration supports a server with Docker Compose or a container hosting service with a persistent disk. No hosting account has been connected or charged, and no public deployment exists yet.

## Container deployment

1. Clone the private repository on the server using your GitHub access.
2. Copy `apps/web/.env.example` to `apps/web/.env.production`, and fill in the hosted Supabase public URL/key and final HTTPS site URL. Configure optional service secrets there or in the host's secret settings. Never commit this file.
3. Apply the Supabase migrations and install/enroll the hosted course. The offline demo database and test accounts are not production accounts.
4. Run `docker compose --env-file apps/web/.env.production up --build -d` from the repository root.
5. Put an HTTPS reverse proxy in front of `127.0.0.1:3000`, configure DNS, and add the final URL to the Supabase authentication redirect settings.
6. Verify `/api/health`, account sign-in, private course access, audio playback, homework uploads and a teacher reply before inviting learners.

The image installs the PDF parser used by uploaded exam-answer processing. Browser keys are public build arguments; changing them requires rebuilding the image. Other credentials belong in the runtime environment. The container starts as an unprivileged user and does not enable offline demo accounts.

Mount persistent storage at `/data`. The startup script seeds `/data/private` from the bundled course files without replacing existing files, and the application's private directory links to that persistent storage. Uploads, library additions and original materials therefore survive restarts. Back up this volume together with the hosted database. Later changes to an already seeded course file require an explicit data update; the startup copy deliberately preserves the existing file.

The health endpoint confirms the web process is running; it does not prove that Supabase, email, video calls or AI inference are reachable. Configure the notification email worker separately as described in [student workspace setup](STUDENT_WORKSPACE.md). Ollama needs a separately reachable inference server if it is used in production.

## Render option

`render.yaml` describes one Starter Docker web service with a 5 GB persistent disk mounted at `/data`. This is a paid configuration; do not apply it unless the account owner accepts the current provider charges. No service or billing subscription has been created by adding this file. Review [Render pricing](https://render.com/pricing) and [persistent disks](https://render.com/docs/disks).

After connecting your GitHub account to Render, create a Blueprint from the private `Adam-7th-2/spolk` repository and review the proposed resources. Fill in the requested public URL and Supabase settings. Configure any remaining secrets in the service environment, not in Git. Render translates the public environment settings to Docker build arguments. Automatic redeployment is disabled in this template; manually deploy after reviewing changes. Verify the final Render HTTPS URL matches `NEXT_PUBLIC_SITE_URL` and the Supabase redirect settings.

Docker is not installed on the development computer, so the container image has not been built here. The storage-seeding script has automated tests; the final image and live service still need validation on the chosen host.
