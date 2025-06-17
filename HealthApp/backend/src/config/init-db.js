const { Client } = require('pg');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'healthapp_db';
const DB_USER = process.env.DB_USER || 'healthapp_user';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

if (!DB_PASSWORD) {
  console.error('DB_PASSWORD environment variable is required');
  process.exit(1);
}

async function initializeDatabase() {
  // Connect to default postgres database to create new database and user
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres',
    user: process.env.DB_SUPER_USER || 'postgres',
    password: process.env.DB_SUPER_PASSWORD
  });

  if (!process.env.DB_SUPER_PASSWORD) {
    console.error('DB_SUPER_PASSWORD environment variable is required for database initialization');
    process.exit(1);
  }

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create database if it doesn't exist
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    console.log(`Database ${DB_NAME} created successfully`);

    // Create user if it doesn't exist
    await client.query(`
      DO
      $do$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
          CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
        END IF;
      END
      $do$
    `);
    console.log(`User ${DB_USER} created successfully`);

    // Grant privileges
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER}`);
    console.log(`Privileges granted to ${DB_USER}`);

  } catch (error) {
    if (error.code === '42P04') {
      console.log(`Database ${DB_NAME} already exists`);
    } else if (error.code === '42710') {
      console.log(`User ${DB_USER} already exists`);
    } else {
      console.error('Error initializing database:', error);
      throw error;
    }
  } finally {
    await client.end();
  }
}

// Create a new client to connect to the new database and set up extensions
async function setupDatabase() {
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD
  });

  try {
    await client.connect();
    console.log(`Connected to ${DB_NAME}`);

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('UUID extension enabled');

    // Enable pgcrypto extension for additional encryption functions
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('pgcrypto extension enabled');

  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the initialization
async function run() {
  try {
    await initializeDatabase();
    await setupDatabase();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  run();
}

module.exports = { initializeDatabase, setupDatabase }; 