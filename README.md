# Vayu Monorepo

Welcome to the **Vayu** project repository. This project uses a monorepo architecture leveraging `pnpm` workspaces to manage isolated frontend apps, backend APIs, shared packages, and AI services.

## Project Structure

```
vayu/
├── apps/
│   ├── web/           # React + Vite frontend application
│   └── api/           # FastAPI backend application
├── packages/          # Shared TypeScript/JavaScript modules
│   ├── config/
│   ├── prompts/
│   ├── sdk/
│   ├── types/
│   └── ui/
├── services/          # Isolated AI services (Python/TS)
│   ├── llm/
│   ├── memory/
│   ├── search/
│   ├── stt/
│   ├── tools/
│   ├── tts/
│   └── vision/
├── docker/            # Docker Compose and Dockerfiles
├── docs/              # Architecture and design documentation
├── scripts/           # Automation and deployment scripts
└── tests/             # E2E integration tests
```

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (>= 18.x)
- **pnpm** (>= 8.x) (`npm install -g pnpm`)
- **Python** (>= 3.11)

---

## Initial Setup

Follow these steps to set up the repository for local development:

### 1. Install Node Dependencies
From the root of the project, run:
```bash
pnpm install
```
*Note: If prompted, run `pnpm approve-builds` to allow post-install scripts to execute for specific dependencies.*

### 2. Set up Python Environment (Backend)
We use a virtual environment (`venv`) to isolate Python dependencies.
From the root of the project:

**On Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r apps/api/requirements.txt
```

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r apps/api/requirements.txt
```

---

## Running the Applications

We provide handy workspace scripts in the root `package.json` to start your apps easily.

### Start the Frontend (Web)
Run the React development server:
```bash
pnpm run dev:web
```
This will start the frontend on `http://localhost:5173`.

### Start the Backend (API)
Ensure your Python virtual environment is activated, then run:
```bash
pnpm run dev:api
```
This will start the FastAPI backend server using Uvicorn with hot-reloading on `http://localhost:8000`. 
Check out the interactive API docs at `http://localhost:8000/docs`.

---

## Linting & Testing

To ensure code quality, you can run linting and tests across the monorepo:

- **Lint Frontend:** `pnpm run lint:web`
- **Lint Backend:** `pnpm run lint:api` (Runs `ruff`)
- **Test Frontend:** `pnpm run test:web` (Runs `vitest`)
- **Test Backend:** `pnpm run test:api` (Runs `pytest`)
- **Build Frontend:** `pnpm run build:web`

---

## Docker Setup (Optional)

If you prefer to run the entire stack via Docker, you can use the provided Docker Compose configuration:

```bash
docker-compose -f docker/docker-compose.yml up --build
```
- **Web App:** Available at `http://localhost:5173`
- **API Server:** Available at `http://localhost:8000`

---

## Adding New Features

- **Frontend components:** Add new UI components to `packages/ui` to make them available across all applications, or to `apps/web/src/components` if they are strictly web-specific.
- **Backend services:** When adding new AI capabilities, build them as isolated modules inside `services/<domain>` (e.g., `services/llm`). Import them cleanly into the FastAPI layer via `apps/api/app/services`.
