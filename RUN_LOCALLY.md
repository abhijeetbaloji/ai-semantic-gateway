# Running the AI Semantic Gateway Locally

This guide explains how to run the AI Semantic Gateway on your local machine for development, testing, or demonstrations.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
* **Java 21** (JDK)
* **Maven 3.9+**
* **Node.js 18+** & **npm 9+**
* **Docker & Docker Compose** (Optional, but recommended for single-command setup)

---

## Option 1: Using Docker (Easiest & Recommended)

If you have Docker Desktop installed and running, you can start the entire stack (Frontend, Backend, and PostgreSQL with pgvector) with a single command.

### 1. Setup Environment
Copy the example environment template to create your `.env` file:
```bash
cp .env.example .env
```

### 2. Configure Credentials (Optional)
By default, the application runs in **Mock Mode** (`OPENAI_MOCK=true`), which generates deterministic mock embeddings and responses without needing an OpenAI API key.
To use real AI:
1. Open your `.env` file.
2. Change `OPENAI_MOCK=false`.
3. Add your OpenAI API key: `OPENAI_API_KEY=sk-proj-...`

### 3. Start the Application
Run the following command at the root of the project:
```bash
docker compose up --build
```

### 4. Access the App
* **Web UI (Frontend):** [http://localhost:5173](http://localhost:5173)
* **API Health (Backend):** [http://localhost:8080/api/v1/status](http://localhost:8080/api/v1/status)
* **API Stats:** [http://localhost:8080/api/v1/stats](http://localhost:8080/api/v1/stats)

To stop the services, run:
```bash
docker compose down
```

---

## Option 2: Running Manually (Without Local Docker)

If you do not have Docker installed, you can run the frontend and backend services directly on your Mac/Windows machine, connecting the backend to your hosted cloud database (e.g., Supabase).

### Step 1: Start the Spring Boot Backend

1. Navigate to the backend directory:
   ```bash
   cd services/semantic-gateway
   ```

2. Run the Spring Boot application using Maven, supplying your database and API credentials as environment variables:
   ```bash
   # Connects directly to the Supabase Transaction Pooler (port 6543)
   # and disables prepared statements via prepareThreshold=0 to prevent PgBouncer errors.
   DB_URL="jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?prepareThreshold=0" \
   DB_USER="postgres.frykbftdxjnwxeypozxl" \
   DB_PASSWORD="YourSupabasePassword" \
   OPENAI_MOCK=false \
   OPENAI_API_KEY="sk-proj-YourOpenAIApiKey" \
   mvn spring-boot:run
   ```

3. The backend is successfully running when you see: `Started GatewayApplication in X.XXX seconds` on port `8080`.

### Step 2: Start the React Frontend

1. Open a new terminal tab/window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser to **[http://localhost:5173](http://localhost:5173)** to access the local gateway playground.

---

## Environment Variables Reference

| Environment Variable | Description | Default / Example |
|---|---|---|
| `DB_URL` | JDBC database connection string | `jdbc:postgresql://localhost:5432/semantic_db` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `OPENAI_API_KEY` | Your OpenAI API key (starts with `sk-...`) | `sk-proj-xxxx...` |
| `OPENAI_MOCK` | Toggle mock embeddings and completions | `true` (use mock) / `false` (use OpenAI) |
| `CACHE_THRESHOLD` | Minimum cosine similarity score to trigger a cache hit | `0.80` (values range from `0.0` to `1.0`) |
| `PROMPT_MAX_LENGTH`| Maximum character limit for incoming prompts | `8000` |

---

## Troubleshooting Local Setups

### ❌ `PSQLException: ERROR: prepared statement "S_X" does not exist`
* **Why:** You are connecting to the Supabase pooler on port `6543` in Transaction Mode. PgBouncer routes queries across multiple connection threads and does not support session-scoped prepared statements.
* **Fix:** Append `?prepareThreshold=0` to the end of your `DB_URL` connection string.

### ❌ `PSQLException: ERROR: memory required is X MB, maintenance_work_mem is Y MB`
* **Why:** The pgvector index creation statement (`CREATE INDEX ... USING ivfflat`) requires more memory than the default Supabase free-tier limits.
* **Fix:** The backend handles this error gracefully and will bypass index creation if memory is constrained. The app will run normally using sequential scanning, which is extremely fast for demo datasets.

### ❌ `ERR_BLOCKED_BY_CLIENT` in Browser Console
* **Why:** Your browser's adblocker (e.g., uBlock Origin or Brave Shields) is blocking requests containing the path `/health` or `/metrics` because it flags them as tracking telemetry.
* **Fix:** The frontend and backend have been updated to use `/status` and `/stats` aliases, which bypass adblock filters. Disable shields for your localhost origin if you experience further blocked requests.
