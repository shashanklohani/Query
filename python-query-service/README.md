# Python Query Service

A lightweight FastAPI service for handling query requests from the frontend workspace.

## Run locally

```bash
cd python-query-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Environment

Create a `.env` file if needed:

```env
APP_NAME=Python Query Service
APP_ENV=development
APP_PORT=8001
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

## Endpoints

- `GET /health`
- `POST /api/query`
