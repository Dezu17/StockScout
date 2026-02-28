# StockScout

A full-stack project for a stock dashboard using:

- **Backend**: .NET 8 minimal API (C#) hitting Alpha Vantage
- **Frontend**: React + TypeScript + Vite + Fluent UI v9

## Quick Start

### 1. Alpha Vantage API Key
Create a free key: https://www.alphavantage.co/support/#api-key

You can store the key in a local `.env` (ignored by git). The backend loads it at startup via DotNetEnv before building configuration.

Edit the generated `.env` file (do not commit it):
	```
	ALPHAVANTAGE__APIKEY=YOUR_REAL_KEY_HERE
	```
Leave `appsettings.json` key blank. Environment variables override appsettings automatically.

### 2. Database Setup (PostgreSQL with Docker)

The app uses PostgreSQL for storing user watchlists. Docker is required.

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

#### Start the Database
From the repo root:
```powershell
docker-compose up -d
```

This starts a PostgreSQL container with:
- **Host**: localhost
- **Port**: 5432
- **Database**: stockscout
- **Username**: stockscout
- **Password**: StockScout-Admin17

#### Apply Database Migrations
```powershell
cd StockScout.Api
dotnet ef database update
```

> **Note**: If you don't have the EF tools installed, run:
> ```powershell
> dotnet tool install --global dotnet-ef
> ```

#### Useful Docker Commands
```powershell
docker-compose up -d      # Start container
docker-compose down       # Stop container
docker-compose down -v    # Stop and remove data volume
docker ps                 # Check running containers
```

### 3. Backend
From the repo root:
```powershell
cd StockScout.Api
dotnet restore; dotnet run
```
Default URL: http://localhost:5005
Swagger UI: http://localhost:5005/swagger
Health check: http://localhost:5005/api/health

### 4. Frontend
In a new terminal:
```powershell
cd stockscout-web
npm install
npm run dev
```
Vite dev server: http://localhost:5173

It uses `.env.development` which sets:
```
VITE_API_BASE=http://localhost:5005/api
```
Adjust if you change backend port.

The app also uses Firebase Authentication. Set up a Firebase project and add the following environment variables to `StockScout.Web/.env` (also see `StockScout.Web/.env.example` for example):

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

To get these values:
1. Go to https://console.firebase.google.com/
2. Create a new project (or use existing)
3. Add a Web app to your project
4. Copy the config values from the Firebase SDK snippet

Additionaly, the app includes an AI chatbot powered by Google Gemini. To enable it:

1. Get a Gemini API key from https://makersuite.google.com/app/apikey
2. Add to `StockScout.Web/.env`:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

The chatbot icon appears in the bottom-right corner of the app.

### 5. Try It
1. On the authentication page, create a new account or log in with an existing account.
2. You'll see the **Dashboard** with two panels:
   - **Left Panel**: 
     - **Quote Lookup**: Enter a stock symbol (e.g. MSFT, AAPL) and click "Get Quote" to view stock data. Use the "Add to My Watchlist" button to save stocks.
     - **Market News**: Displays latest market news (planned for future).
   - **Right Panel**: 
     - **My Watchlist**: Shows your saved stocks as QuoteCards. Click "Remove from My Watchlist" to remove items.
3. **AI Chatbot**: Click the speech bubble icon (bottom-right corner) to open the Gemini-powered chatbot for stock insights.


## Continuous Integration (CI)
GitHub Actions workflow: `.github/workflows/ci.yml`

What it does on each push to `main`:
1. Checks out code.
2. Builds backend (.NET 8).
3. Installs and builds frontend (Node + Vite).
4. Verifies .NET formatting and runs lint + Prettier checks.
5. Runs a simple secret pattern check.

## Code Quality (Lint & Formatting)
Frontend:
- Lint: `npm run lint` (ESLint with TypeScript + React rules)
- Format: `npm run format` (Prettier write) / `npm run format:check` (CI verification)

Backend:
- Format verification: `dotnet format --verify-no-changes` (run manually or rely on CI step)