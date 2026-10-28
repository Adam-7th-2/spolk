# Free hosting for the full academy

The private GitHub repository includes all 772 supplied course files in `apps/web/private/books/` and `apps/web/private/library/`. These paths stay outside `public/` and are served through authenticated application routes. Credentials, live student work, and the offline database are not in Git or the Docker build context.

The selected deployment uses one **free Render Docker web service**, the existing **Supabase Free database/authentication project**, and a **private Supabase Storage bucket** for new uploads. `render.yaml` uses `plan: free` and does not request a paid disk or database. No service or subscription has been created by adding this configuration.

## Connect and deploy

1. Connect Render and Supabase to this workspace, or use the corresponding provider dashboards. Render needs access to the private `Adam-7th-2/spolk` GitHub repository.
2. Ensure the Supabase project is active. Apply the application migrations in order, including `202610190003_private_upload_bucket.sql`. That migration creates the non-public `spolk-private-uploads` bucket. It adds no anonymous or authenticated Storage object policies: the app authorizes each request before its server-side client reads or writes the bucket.
3. Create a Render Blueprint from the repository and review that the service plan is **Free** and no disk or paid resource is proposed.
4. Provide `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Render's environment settings. Only the public URL/key are Docker build arguments. Keep the service-role key server-only and never paste it into source code.
5. The Blueprint sets `PRIVATE_UPLOAD_STORAGE=supabase` and `PRIVATE_UPLOAD_BUCKET=spolk-private-uploads`. Render's default `RENDER_EXTERNAL_URL` supplies the HTTPS site URL at build time and runtime. For a custom domain, set `NEXT_PUBLIC_SITE_URL` and rebuild.
6. Add the final HTTPS site URL and `/auth/callback` to the Supabase authentication redirect configuration. Install/enroll the hosted course if needed. The local demo database is not uploaded or merged automatically; real hosted accounts are required.
7. Push reviewed changes to `main` to deploy automatically. Verify `/api/health`, sign-in, course pages/audio, a homework upload/download, an exam-answer upload, and a teacher reply after each deployment.

The web process, Python PDF parser, and original course assets ship in the Docker image. On startup the source assets are copied into the application's private filesystem. With the cloud-upload setting, homework files, exam answers/metadata, and administrator library additions are stored in Supabase Storage rather than that ephemeral filesystem. Course source files can be recreated from the image whenever the free service restarts. Library uploads are limited to 50 MB per file; homework and exam uploads retain their smaller limits.

The health endpoint checks the web process only, not Supabase or optional providers. Hosted startup refuses to enable the free Render configuration without cloud upload storage and a server-side storage credential.

## Free service limits

Render's free web services sleep after 15 minutes without inbound traffic and take about a minute to wake up. They have no persistent disks and have monthly runtime, build, and bandwidth limits. Choose a free workspace and monitor included usage; do not enable upgrades or add paid resources under a free-only budget. See [Render Free](https://render.com/docs/free).

Supabase Free currently includes 500 MB of database storage and 1 GB of file storage, plus limited egress. Inactive projects may pause. Original course files are served from the container image so they do not use this upload bucket's storage allowance. New student/library uploads use the quota and must be monitored. See [Supabase pricing](https://supabase.com/pricing).

Email delivery, AI inference, and live-class providers need their own connected services and usage limits. The configuration leaves notification email delivery disabled; workspace notifications do not require an email provider. A public deployment has not been verified yet, and Docker is not installed on the development computer, so the final image still needs a build and smoke check on the connected host.

## Optional server deployment

For a separately managed server, `compose.yaml` can mount a persistent Docker volume at `/data`. Copy `apps/web/.env.example` to the ignored `apps/web/.env.production`, fill in the public HTTPS site URL and hosted Supabase settings, then run `docker compose --env-file apps/web/.env.production up --build -d`. Put an HTTPS reverse proxy in front of `127.0.0.1:3000`.

In local-storage mode the startup copy preserves existing files. Back up the private volume together with the database. Course changes to an already seeded file need an explicit data update because startup does not overwrite existing files. This optional server setup is separate from the free Render Blueprint.
