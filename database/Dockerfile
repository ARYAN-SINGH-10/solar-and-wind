FROM postgis/postgis:15-3.3

# Copy database initial SQL script
COPY init.sql /docker-entrypoint-initdb.d/01_init.sql

EXPOSE 5432
