FROM "postgres:9-alpine"

COPY init-solar-db.sh /docker-entrypoint-initdb.d/init-solar-db.sh