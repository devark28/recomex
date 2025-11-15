# Testing Guide

This document explains how to run the unit tests for the Recomex project.

## Backend Tests

The backend uses Jest for unit testing.

### Setup
```bash
cd backend
npm install
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage
- **UserService**: Authentication, registration, user management
- **ClientService**: Client creation, activation, deletion with cascade
- **ActionService**: Action creation, polling, status updates
- **Integration**: Client deletion cascade behavior

## Frontend Tests

The frontend uses Vitest for unit testing.

### Setup
```bash
cd frontend
npm install
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui
```

### Test Coverage
- **ApiService**: HTTP requests, authentication, error handling
- **CryptoService**: RSA encryption, key handling, data conversion

## Key Features Tested

### Client Deletion with Cascade
The client deletion feature automatically removes all associated actions through database CASCADE constraints:

```sql
-- Actions table has CASCADE constraint
client_id INTEGER REFERENCES clients (id) ON DELETE CASCADE
```

When a client is deleted:
1. The `ClientService.deleteClient()` method removes the client
2. PostgreSQL automatically deletes all related actions
3. Only the client owner can delete their clients

### Security Features
- JWT token validation
- RSA encryption for action payloads  
- User authentication and authorization
- Input validation and error handling

### API Endpoints Tested
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/clients` - Get user's clients
- `POST /api/clients` - Create new client
- `DELETE /api/clients/:id` - Delete client (with cascade)
- `POST /api/actions` - Send action to client

## Running All Tests

From the project root:
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test
```