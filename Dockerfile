# Stage 1: build the React frontend (output lands in /build/app/web, see frontend/vite.config.ts)
FROM node:22-slim AS web
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Stage 2: FastAPI app serving the API and the built frontend
FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY --from=web /build/app/web ./app/web
ENV SCOPELOCK_DB=/tmp/scopelock.db PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
