SELECT 'CREATE DATABASE weather_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'weather_db')\gexec