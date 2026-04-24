#!/bin/bash

# ============================================
#  ProTrades AI Estimator - Start Script
#  Plumbing · Electrical · HVAC
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════╗"
echo "║   ⚡ ProTrades AI Estimator             ║"
echo "║   Plumbing · Electrical · HVAC          ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Creating default...${NC}"
  cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hvac_estimator
DB_USER=postgres
DB_PASSWORD=postgres
BACKEND_PORT=3001
FRONTEND_PORT=3000
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
JWT_SECRET=hvac-estimator-secret-key-2024
ENVEOF
  export $(grep -v '^#' .env | xargs)
  echo -e "${YELLOW}⚠ Default .env created. Please update OPENROUTER_API_KEY.${NC}"
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# ============================================
# Step 1: Clean used ports
# ============================================
echo -e "\n${CYAN}[1/6] Cleaning used ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT
echo -e "${GREEN}✓ Ports $BACKEND_PORT and $FRONTEND_PORT are free${NC}"

# ============================================
# Step 2: Check and setup PostgreSQL
# ============================================
echo -e "\n${CYAN}[2/6] Setting up PostgreSQL database...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  if command -v brew &> /dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  fi
  sleep 2

  if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
    echo -e "${RED}✗ PostgreSQL is not running. Please start it manually.${NC}"
    echo -e "${YELLOW}  Try: brew services start postgresql${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Create database if it doesn't exist
DB_NAME=${DB_NAME:-hvac_estimator}
DB_USER=${DB_USER:-postgres}

if ! psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo -e "${YELLOW}  Creating database '$DB_NAME'...${NC}"
  createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER $DB_NAME 2>/dev/null || \
  psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
fi
echo -e "${GREEN}✓ Database '$DB_NAME' ready${NC}"

# ============================================
# Step 3: Install dependencies
# ============================================
echo -e "\n${CYAN}[3/6] Installing dependencies...${NC}"

# Backend dependencies
echo -e "${BLUE}  Installing backend packages...${NC}"
cd backend
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  npm install --silent 2>&1 | tail -1
fi
echo -e "${GREEN}  ✓ Backend dependencies installed${NC}"

# Frontend dependencies
echo -e "${BLUE}  Installing frontend packages...${NC}"
cd ../frontend
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  npm install --silent 2>&1 | tail -1
fi
echo -e "${GREEN}  ✓ Frontend dependencies installed${NC}"
cd ..

# ============================================
# Step 4: Seed database
# ============================================
echo -e "\n${CYAN}[4/6] Seeding database with demo data...${NC}"
cd backend
node src/seeds/seed.js
cd ..

# ============================================
# Step 5: Start backend with hot reload
# ============================================
echo -e "\n${CYAN}[5/6] Starting backend server (port $BACKEND_PORT) with hot reload...${NC}"
cd backend
npx nodemon src/index.js &
BACKEND_PID=$!
cd ..
sleep 2
echo -e "${GREEN}✓ Backend running on http://localhost:$BACKEND_PORT${NC}"

# ============================================
# Step 6: Start frontend with hot reload
# ============================================
echo -e "\n${CYAN}[6/6] Starting frontend (port $FRONTEND_PORT) with hot reload...${NC}"
cd frontend
PORT=$FRONTEND_PORT BROWSER=none npx react-scripts start &
FRONTEND_PID=$!
cd ..

# ============================================
# Cleanup handler
# ============================================
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================
# Ready!
# ============================================
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ ProTrades AI Estimator is RUNNING!         ║"
echo "║                                                  ║"
echo "║   Frontend:  http://localhost:$FRONTEND_PORT            ║"
echo "║   Backend:   http://localhost:$BACKEND_PORT            ║"
echo "║                                                  ║"
echo "║   Demo Login:                                    ║"
echo "║     Email:    demo@hvacpro.com                   ║"
echo "║     Password: password123                        ║"
echo "║                                                  ║"
echo "║   Hot reload is ON - changes auto-refresh!       ║"
echo "║   Press Ctrl+C to stop all services              ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Wait for child processes
wait
