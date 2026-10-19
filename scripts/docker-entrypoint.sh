#!/bin/sh
set -eu
# New host-mounted disks can belong to root. Only prepare this dedicated volume,
# then drop privileges before seeding files or starting the application.
mkdir -p /data/private
chown node:node /data /data/private
exec gosu node "$@"
