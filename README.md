# Recomex - Remote Control System

A remote control system for GNOME environments that allows you to control media playback, volume, and brightness from a web interface.

## Architecture

- **Backend**: Express + TypeScript + PostgreSQL
- **Frontend**: React + TypeScript + Vite
- **Local Client**: GJS + GNOME Shell APIs

## Features

- **Media Control**: Play/pause, next/previous track via MPRIS
- **Volume Control**: Increase/decrease volume, mute/unmute
- **Brightness Control**: Adjust screen brightness
- **Security**: End-to-end encryption with RSA keys
- **Delayed Actions**: Schedule actions to execute at specific times
- **Multi-client Support**: Manage multiple devices from one interface

## Setup

### Prerequisites

- Node.js 22+
- PostgreSQL
- GNOME desktop environment (for local client)

### Backend Setup

```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your database credentials
npm run db:init
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Local Client Setup

See [local-client/README.md](local-client/README.md) for detailed installation instructions.

```bash
cd local-client
npm install
npm run build
npm run start
```

## Usage

1. Start the backend server
2. Open the frontend in your browser
3. Register a user account
4. Add a new client device
5. Run the local client on your GNOME machine
6. Use the web interface to send commands to your device

## Security

- User authentication with JWT tokens
- Client registration with RSA key pairs
- End-to-end encryption of action payloads
- Configurable module enabling/disabling on client side

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Clients
- `GET /api/clients` - Get user's clients
- `POST /api/clients` - Register new client
- `DELETE /api/clients/:id` - Delete client

### Actions
- `POST /api/actions` - Send action to client
- `GET /api/actions/poll/:clientId` - Poll for pending actions
- `PATCH /api/actions/:actionId/failure` - Report action failure