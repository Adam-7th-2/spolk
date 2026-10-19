FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci
COPY . .
# Public browser configuration only. Secrets are supplied to the running service.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG RENDER_EXTERNAL_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY} \
    NEXT_TELEMETRY_DISABLED=1
RUN export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-$RENDER_EXTERNAL_URL}" \
    && npm run build && npm prune --omit=dev --ignore-scripts

FROM node:24-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv gosu \
    && python3 -m venv /opt/spolk-python \
    && /opt/spolk-python/bin/pip install --no-cache-dir PyMuPDF==1.28.2 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /app /app
RUN mv /app/apps/web/private /opt/spolk-course-assets \
    && mkdir -p /data \
    && chown node:node /data \
    && ln -s /data/private /app/apps/web/private \
    && chmod 755 /app/scripts/docker-entrypoint.sh
ENV NODE_ENV=production \
    SPOLK_DATA_MODE=hosted \
    PYTHON_BIN=/opt/spolk-python/bin/python \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
EXPOSE 3000
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["node", "scripts/start-hosted.mjs"]
