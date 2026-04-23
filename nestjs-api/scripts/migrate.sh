#!/bin/sh

set -eu

DIRECTION="${1:-up}"
ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
MIGRATIONS_DIR="$(CDPATH= cd -- "$(dirname "$0")/../migrations" && pwd)"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-query_db}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to run this migration."
  exit 1
fi

run_migration() {
  file="$1"
  docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T "$POSTGRES_SERVICE" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$file"
}

case "$DIRECTION" in
  up)
    for file in "$MIGRATIONS_DIR"/*.up.sql; do
      [ -e "$file" ] || continue
      run_migration "$file"
    done
    ;;
  down)
    for file in $(find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.down.sql' | sort -r); do
      run_migration "$file"
    done
    ;;
  *)
    echo "Unsupported migration direction: $DIRECTION"
    echo "Usage: sh ./scripts/migrate.sh [up|down]"
    exit 1
    ;;
esac
