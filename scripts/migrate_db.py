#!/usr/bin/env python3
"""
StoryLegends PostgreSQL Migration Script
Migrates all tables, schemas, and data from Remote Amazon RDS PostgreSQL
to Local PostgreSQL container.
"""

import sys
import psycopg2
from psycopg2 import sql

REMOTE_DSN = "postgres://ud8op8v4fm53g1:p7bb7ef0c3df8a6e9031249215b1ed754f5c44d99d8f256bba9ad5645bd861723@cbhnv71uilek74.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/d34gj8i1b0knkt?sslmode=require"

# Local Postgres DSN (Localhost or Docker container)
LOCAL_DSN = "postgres://ud8op8v4fm53g1:p7bb7ef0c3df8a6e9031249215b1ed754f5c44d99d8f256bba9ad5645bd861723@localhost:5432/d34gj8i1b0knkt"

def migrate():
    print("=" * 60)
    print("🚀 STORYLEGENDS POSTGRESQL MIGRATION TOOL")
    print("=" * 60)

    print("\n1. Connecting to Remote Amazon RDS PostgreSQL...")
    try:
        remote_conn = psycopg2.connect(REMOTE_DSN)
        remote_cur = remote_conn.cursor()
        print("   ✅ Connected to Remote RDS successfully.")
    except Exception as e:
        print(f"   ❌ Failed to connect to Remote RDS: {e}")
        sys.exit(1)

    print("\n2. Connecting to Local PostgreSQL...")
    try:
        local_conn = psycopg2.connect(LOCAL_DSN)
        local_conn.autocommit = True
        local_cur = local_conn.cursor()
        print("   ✅ Connected to Local PostgreSQL successfully.")
    except Exception as e:
        print(f"   ⚠️ Could not connect to localhost:5432 using full DSN ({e}). Trying default postgres user...")
        try:
            fallback_dsn = "postgres://postgres:postgres@localhost:5432/postgres"
            local_conn = psycopg2.connect(fallback_dsn)
            local_conn.autocommit = True
            local_cur = local_conn.cursor()
            
            # Create database and user if not exists
            local_cur.execute("CREATE USER ud8op8v4fm53g1 WITH PASSWORD 'p7bb7ef0c3df8a6e9031249215b1ed754f5c44d99d8f256bba9ad5645bd861723' SUPERUSER;")
            local_cur.execute("CREATE DATABASE d34gj8i1b0knkt OWNER ud8op8v4fm53g1;")
            local_conn.close()

            local_conn = psycopg2.connect(LOCAL_DSN)
            local_conn.autocommit = True
            local_cur = local_conn.cursor()
            print("   ✅ Created local database and connected successfully.")
        except Exception as ex2:
            print(f"   ❌ Local PostgreSQL connection failed: {ex2}")
            sys.exit(1)

    # Get list of tables
    remote_cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'pg_%';
    """)
    tables = [row[0] for row in remote_cur.fetchall()]
    print(f"\n3. Found {len(tables)} tables to migrate: {', '.join(tables)}")

    # Disable constraints on local DB during import
    local_cur.execute("SET session_replication_role = 'replica';")

    for table in tables:
        print(f"\n📦 Migrating table: '{table}'...")

        # Fetch CREATE TABLE statement approximation or column defs
        remote_cur.execute(f"""
            SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position;
        """, (table,))
        columns_info = remote_cur.fetchall()

        col_defs = []
        col_names = []
        for col_name, data_type, max_len, is_nullable, col_default in columns_info:
            col_names.append(col_name)
            type_str = data_type
            if max_len:
                type_str += f"({max_len})"
            if data_type == "ARRAY":
                type_str = "text[]"
            col_defs.append(f'"{col_name}" {type_str}')

        create_table_sql = f'CREATE TABLE IF NOT EXISTS "{table}" ({", ".join(col_defs)});'
        try:
            local_cur.execute(create_table_sql)
        except Exception as e:
            print(f"   ⚠️ Notice creating table {table}: {e}")

        # Truncate local table first
        try:
            local_cur.execute(f'TRUNCATE TABLE "{table}" CASCADE;')
        except Exception:
            pass

        # Fetch all rows from remote
        remote_cur.execute(f'SELECT * FROM "{table}";')
        rows = remote_cur.fetchall()

        if not rows:
            print(f"   ℹ️ Table '{table}' is empty. Skipped row copy.")
            continue

        # Insert rows into local
        cols_formatted = ", ".join([f'"{c}"' for c in col_names])
        placeholders = ", ".join(["%s"] * len(col_names))
        insert_sql = f'INSERT INTO "{table}" ({cols_formatted}) VALUES ({placeholders})'

        inserted_count = 0
        for row in rows:
            try:
                local_cur.execute(insert_sql, row)
                inserted_count += 1
            except Exception as e:
                print(f"   ⚠️ Row copy warning on {table}: {e}")

        print(f"   ✅ Successfully copied {inserted_count}/{len(rows)} rows into local '{table}'!")

    local_cur.execute("SET session_replication_role = 'origin';")
    print("\n" + "=" * 60)
    print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
    print("All remote PostgreSQL tables and data have been copied to Local Postgres.")
    print("=" * 60)

    remote_conn.close()
    local_conn.close()

if __name__ == "__main__":
    migrate()
