# Healthcare Application Backend

A secure backend service for a healthcare application that handles encrypted medical records and consultations. Built with Node.js, Express, and PostgreSQL.

## Features

- Secure user authentication with JWT and 2FA
- Role-based access control (Patient, Doctor, Admin)
- Encrypted medical records management
- Secure medical consultations
- Comprehensive audit logging
- Rate limiting and security headers
- Input validation and sanitization

## Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12.0
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_app
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Encryption Configuration
ENCRYPTION_KEY=your_encryption_key
ENCRYPTION_IV=your_encryption_iv

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd healthcare-app/backend
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
# Create database and user
psql -U postgres -f src/config/init-db.sql

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

4. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA setup
- `POST /api/auth/2fa/verify-login` - Verify 2FA during login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Medical Records Endpoints

- `POST /api/medical-records` - Create a new medical record
- `GET /api/medical-records/:id` - Get a specific medical record
- `PUT /api/medical-records/:id` - Update a medical record
- `GET /api/medical-records/patient/:patientId` - Get all records for a patient
- `GET /api/medical-records/doctor/:doctorId` - Get all records for a doctor
- `DELETE /api/medical-records/:id` - Delete a medical record

### Consultations Endpoints

- `POST /api/consultations` - Create a new consultation
- `GET /api/consultations/:id` - Get a specific consultation
- `PUT /api/consultations/:id/status` - Update consultation status
- `GET /api/consultations/patient/:patientId` - Get all consultations for a patient
- `GET /api/consultations/doctor/:doctorId` - Get all consultations for a doctor
- `PUT /api/consultations/:id/notes` - Add consultation notes

## Security Features

- All sensitive data is encrypted at rest
- JWT-based authentication with refresh tokens
- Two-factor authentication (2FA)
- Role-based access control
- Rate limiting to prevent brute force attacks
- Input validation and sanitization
- Security headers (Helmet)
- CORS protection
- Comprehensive audit logging
- Request ID tracking
- Error handling and logging

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Database Migrations

```bash
# Create a new migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npm run migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment variables
2. Ensure all security measures are properly configured
3. Use a process manager like PM2
4. Set up proper SSL/TLS certificates
5. Configure proper logging and monitoring
6. Set up database backups
7. Use proper firewall rules

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License. 