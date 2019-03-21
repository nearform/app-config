#!/bin/bash
set -e

echo "creating table solar"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<EOSQL
  CREATE TABLE solar (
      annual 	DECIMAL,
      monthly TEXT,
      lat 	DECIMAL,
      lon   DECIMAL
    );
EOSQL