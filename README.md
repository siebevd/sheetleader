# SheetLeader

A tractor horsepower measurement scoreboard system for events with ~100 participants. Display rotating results with sponsor logos and manage data through a visual database interface.

## Project Structure

```
sheetleader/
├── app/                    # Backend API (Bun + Elysia)
│   ├── src/
│   │   ├── routes/        # API route modules
│   │   │   ├── results.ts # Results endpoints
│   │   │   └── images.ts  # Image serving
│   │   ├── db/            # Database schema and seed data
│   │   │   ├── schema.ts  # Drizzle schema
│   │   │   ├── index.ts   # DB connection
│   │   │   └── seed.ts    # Dummy data generator
│   │   └── index.ts       # Main entry point
│   ├── images/            # Sponsor logos served via API
│   ├── data/              # SQLite database storage
│   ├── Dockerfile         # Backend container
│   └── Dockerfile.studio  # Drizzle Studio container
├── frontend/              # Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── Presentation.tsx  # Main presentation/scoreboard view
│   │   ├── ResultCard.tsx    # Reusable result card component
│   │   ├── Home.tsx          # Homepage leaderboard with tabs
│   │   └── App.tsx           # Router setup
│   ├── public/            # Static assets (scherm.jpg background)
│   ├── Dockerfile         # Frontend container (Nginx)
│   └── nginx.conf         # Nginx configuration
├── Caddyfile              # Caddy reverse proxy configuration
├── Dockerfile.caddy       # Caddy container
└── docker-compose.yml     # Orchestrates all services
```

## Services

### 0. Caddy (Port 80/443)

- **Technology**: Caddy 2
- **Purpose**: All-in-one web server serving static files and reverse proxy
- **Functionality**:
  - Serves frontend static files (built React app)
  - Proxies `/api/*` requests to Backend
  - Proxies `/studio/*` requests to Drizzle Studio
  - Handles client-side routing (SPA support with try_files)
- **Benefits**:
  - Single web server for everything (no Nginx needed)
  - Automatic HTTPS with Let's Encrypt
  - Built-in compression and caching
  - Simple configuration

### 1. Backend API

- **Technology**: Bun runtime + Elysia web framework
- **Database**: SQLite with Drizzle ORM (bun:sqlite)
- **Features**:
  - REST API for tractor measurement results
  - Image serving for sponsor logos
  - Search and filtering capabilities
  - Statistics endpoints

**API Endpoints**:

- `GET /api/health` - Health check
- `GET /api/results` - Get all results (ordered by timestamp)
- `GET /api/results/recent` - Get last 10 results
- `GET /api/results/tractor/:model` - Get results by tractor model
- `GET /api/results/search?q=query` - Search by name or tractor
- `GET /api/stats` - Get statistics (total, avg HP, max HP, popular model)
- `GET /api/images` - List all sponsor logos
- `GET /api/images/:filename` - Serve individual sponsor logo

### 2. Frontend

- **Technology**: Vite + React + TypeScript + Tailwind CSS v4
- **Routes**:
  - `/` - Homepage with searchable leaderboard and tabs
  - `/presentation` - Main scoreboard display for event
  - `/health` - Health check page

### 3. Drizzle Studio (Port 4983)

- **Technology**: Drizzle Kit visual database browser
- **Features**:
  - Browse and edit database records
  - Visual table inspector
  - Run queries directly
  - Real-time database management

## Getting Started

### Development Mode

**Backend:**

```bash
cd app
bun install
bun run db:seed        # Seed database with 50 dummy results
bun run dev            # Start backend at http://localhost:3000
```

**Frontend:**

```bash
cd frontend
bun install
bun run dev            # Start frontend at http://localhost:5173
```

**Drizzle Studio:**

```bash
cd app
bun run db:studio      # Open at http://localhost:4983
```

### Docker (Production)

**Setup:**

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and set your domain (optional):

```env
# For local development (default)
DOMAIN=localhost

# For production with your domain
DOMAIN=yourdomain.com
```

**Run all services with Caddy:**

```bash
docker-compose up --build
```

**Production (DOMAIN=yourdomain.com):**

- Frontend: https://yourdomain.com/
- Presentation: https://yourdomain.com/presentation
- Backend API: https://yourdomain.com/api/*
- Drizzle Studio: https://yourdomain.com/studio/

Caddy automatically obtains and renews SSL certificates from Let's Encrypt when using a real domain.

**Run specific service:**

```bash
docker-compose up caddy              # Web server (serves frontend + proxies)
docker-compose up backend            # API only
docker-compose up frontend-build     # Build frontend static files
docker-compose up drizzle-studio     # Database UI only
```

**Stop services:**

```bash
docker-compose down
```

## Database Schema

**Results Table:**

- `id` - Auto-increment primary key
- `name` - Participant name (e.g., "Jan de Vries")
- `tractor` - Tractor model (e.g., "Fendt 356", "John Deere 6420")
- `horsepower` - Measured horsepower (integer)
- `timestamp` - Measurement timestamp

## Environment Variables

**Root (.env):**

```env
# Domain for Caddy reverse proxy
DOMAIN=localhost  # Use 'yourdomain.com' for production with automatic SSL
```

**Backend (app/.env):**

```env
PORT=3000
NODE_ENV=development
```

**Frontend (frontend/.env):**

```env
VITE_API_URL=http://localhost:3000
```

Note: Copy [.env.example](.env.example) to `.env` and customize as needed.

## Adding Sponsor Logos

Place image files in `app/images/` directory. Supported formats:

- JPG/JPEG
- PNG
- GIF
- WebP

The presentation view will automatically rotate through all images every 30 seconds.

## Tech Stack

- **Reverse Proxy**: Caddy 2
- **Runtime**: Bun
- **Backend Framework**: Elysia
- **Database**: SQLite (bun:sqlite)
- **ORM**: Drizzle ORM
- **Frontend Build Tool**: Vite
- **Frontend Framework**: React 18
- **Styling**: Tailwind CSS v4
- **Routing**: React Router
- **Deployment**: Docker + Docker Compose
- **Database UI**: Drizzle Studio
