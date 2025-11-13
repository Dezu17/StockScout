# StockScout

A minimal full-stack starter for a stock dashboard using:

- **Backend**: .NET 8 minimal API (C#) hitting Alpha Vantage
- **Frontend**: React + TypeScript + Vite + Fluent UI v9

> Goal: keep it intentionally simple so you can iterate quickly.

## Quick Start

### 1. Alpha Vantage API Key
Create a free key: https://www.alphavantage.co/support/#api-key

You can store the key in a local `.env` (ignored by git). The backend loads it at startup via DotNetEnv before building configuration.

Edit the generated `.env` file (do not commit it):
	```
	ALPHAVANTAGE__APIKEY=YOUR_REAL_KEY_HERE
	```
Leave `appsettings.json` key blank. Environment variables override appsettings automatically.

### 2. Backend
From the repo root:
```powershell
cd StockScout.Api
dotnet restore; dotnet run
```
Default URL: http://localhost:5005
Swagger UI: http://localhost:5005/swagger
Health check: http://localhost:5005/api/health

### 3. Frontend
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

### 4. Try It
In the UI enter a symbol (e.g. MSFT, AAPL) and click "Get Quote".

## Project Structure
```
StockScout.Api/            # C# minimal API
	Program.cs              # All in one for now (endpoint + service)
	appsettings.json        # Config (don't ship real keys)
stockscout-web/           # React + Vite client
	src/                    # Components & types
```

## How It Works
Backend calls Alpha Vantage `GLOBAL_QUOTE` endpoint and normalizes the response to a compact `QuoteDto`. Frontend fetches `/api/quote/{symbol}` and displays a `QuoteCard` using Fluent UI.

## Environment Variables Mapping
`AlphaVantage:ApiKey` can be supplied via an environment variable named:
```
ALPHAVANTAGE__APIKEY
```

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