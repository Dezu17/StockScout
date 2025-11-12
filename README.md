# StockScout

A minimal full-stack starter for a stock dashboard using:

- **Backend**: .NET 8 minimal API (C#) hitting Alpha Vantage
- **Frontend**: React + TypeScript + Vite + Fluent UI v9

> Goal: keep it intentionally simple so you can iterate quickly.

## Quick Start

### 1. Alpha Vantage API Key
Create a free key: https://www.alphavantage.co/support/#api-key

Set it via environment variable (recommended):

Windows PowerShell:
```powershell
$env:ALPHAVANTAGE__APIKEY = "YOUR_KEY_HERE"
```

Or edit `StockScout.Api/appsettings.json` (don't commit real keys) under `AlphaVantage:ApiKey`.

### 2. Backend
From the repo root:
```powershell
cd StockScout.Api
dotnet restore; dotnet run
```
Default URL (launchSettings): http://localhost:5005
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
(.NET maps double underscore to `:`.)

## Minimal Design Decisions
- Single file backend for speed; refactor into folders (`Services/`, `Endpoints/`) as complexity grows.
- No persistence or caching yet.
- Vite + Fluent UI for a fast, modern DX.

## Next Steps (Ideas)
1. Add in-memory caching (e.g. MemoryCache) to reduce API calls / rate limit hits.
2. Error/state UI improvements (rate limit messages, 404 symbol not found, retry button).
3. Add historical data endpoint (function=TIME_SERIES_DAILY) and small chart (e.g. using `recharts`).
4. Extract AlphaVantage client into its own file with interface + unit tests.
5. Add simple CI (GitHub Actions) restoring, building, running `dotnet format` and `npm build`.
6. .env.example file for clearer onboarding.
7. Dark theme toggle (Fluent UI tokens).

## Lightweight Testing Suggestions
- Backend: Add a test project and test deserialization using a saved Alpha Vantage sample payload.
- Frontend: Add React Testing Library test for symbol search flow (mock fetch).

## License
Add a license of your choice (MIT recommended) before distribution.

Happy hacking! 🚀