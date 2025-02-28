#!/bin/bash

# Check if the PostgreSQL container is already running
if [ ! "$(docker ps -q -f name=nas-veridid-workflow-db)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=nas-veridid-workflow-db)" ]; then
        # Cleanup
        echo "Removing existing PostgreSQL container..."
        docker rm nas-veridid-workflow-db
    fi
    # Run the PostgreSQL container
    echo "Starting PostgreSQL container..."
    docker run --name nas-veridid-workflow-db -e POSTGRES_PASSWORD=password123 -p 5435:5432 -d postgres:16
else
    echo "PostgreSQL container already running."
fi

# Check if the Redis container is already running
if [ ! "$(docker ps -q -f name=cape-fear-sis-redis)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=cape-fear-sis-redis)" ]; then
        # Cleanup
        echo "Removing existing Redis container..."
        docker rm cape-fear-sis-redis
    fi
    # Run the Redis container
    echo "Starting Redis container..."
    docker run --name cape-fear-sis-redis -p 6380:6379 -d redis redis-server --appendonly yes --requirepass super-secret-password
else
    echo "Redis container already running."
fi

# Wait for PostgreSQL to start
sleep 5

# Check if the database exists, and create it if it doesn't
DB_EXISTS=$(docker exec nas-veridid-workflow-db psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'workflow_db'" | tr -d '[:space:]')
if [ "$DB_EXISTS" != "1" ]; then
    echo "Creating database workflow_db..."
    docker exec nas-veridid-workflow-db psql -U postgres -c "CREATE DATABASE \"workflow_db\""
else
    echo "Database workflow_db already exists."
fi

echo "Database setup completed."
