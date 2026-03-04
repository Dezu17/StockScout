using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using StockScout.Api.Configuration;
using StockScout.Api.DTOs;

namespace StockScout.Api.Services;

public class AlphaVantageClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AlphaVantageOptions _options;
    private readonly IMemoryCache _cache;

    public AlphaVantageClient(IHttpClientFactory httpClientFactory, IOptions<AlphaVantageOptions> options, IMemoryCache cache)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _cache = cache;
    }

    public async Task<QuoteDto?> GetQuoteAsync(string symbol, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_options.ApiKey))
            throw new InvalidOperationException("AlphaVantage ApiKey not configured. Set AlphaVantage:ApiKey in appsettings or environment (ALPHAVANTAGE__APIKEY).");

        var cacheKey = $"quote:{symbol}";
        if (_cache.TryGetValue(cacheKey, out QuoteDto? cachedData) && cachedData is not null)
            return cachedData;

        var url = $"{_options.BaseUrl}/query?function=GLOBAL_QUOTE&symbol={Uri.EscapeDataString(symbol)}&apikey={_options.ApiKey}";
        var client = _httpClientFactory.CreateClient();
        using var resp = await client.GetAsync(url, ct);
        if (!resp.IsSuccessStatusCode) return null;
        await using var s = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(s, cancellationToken: ct);
        var dto = QuoteMapper.MapFromGlobalQuote(doc);
        if (dto is not null)
        {
            // Fetch and add currency
            var stockCurrency = await GetSymbolCurrencyAsync(symbol, ct);
            dto = dto with { Currency = stockCurrency };
            
            _cache.Set(
                cacheKey,
                dto,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(Math.Max(1, _options.CacheTtlSeconds))
                });
        }
        return dto;
    }

    public async Task<string?> GetSymbolCurrencyAsync(string symbol, CancellationToken ct = default)
    {
        var cacheKey = $"currency:{symbol}";
        if (_cache.TryGetValue(cacheKey, out string? cachedCurrency) && cachedCurrency is not null)
            return cachedCurrency;

        var url = $"{_options.BaseUrl}/query?function=SYMBOL_SEARCH&keywords={Uri.EscapeDataString(symbol)}&apikey={_options.ApiKey}";
        var client = _httpClientFactory.CreateClient();
        using var resp = await client.GetAsync(url, ct);
        if (!resp.IsSuccessStatusCode) return null;

        await using var s = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(s, cancellationToken: ct);

        if (!doc.RootElement.TryGetProperty("bestMatches", out var matches) || matches.GetArrayLength() == 0)
            return null;

        // Find exact match or use first result
        foreach (var match in matches.EnumerateArray())
        {
            if (match.TryGetProperty("1. symbol", out var sym) && 
                sym.GetString()?.Equals(symbol, StringComparison.OrdinalIgnoreCase) == true)
            {
                if (match.TryGetProperty("8. currency", out var curr))
                {
                    var currency = curr.GetString();
                    if (!string.IsNullOrEmpty(currency))
                    {
                        // Cache currency for 24 hours (rarely changes)
                        _cache.Set(cacheKey, currency, new MemoryCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
                        });
                        return currency;
                    }
                }
            }
        }

        // Fallback to first match if no exact match found
        var firstMatch = matches[0];
        if (firstMatch.TryGetProperty("8. currency", out var firstCurr))
        {
            var currency = firstCurr.GetString();
            if (!string.IsNullOrEmpty(currency))
            {
                _cache.Set(cacheKey, currency, new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
                });
                return currency;
            }
        }

        return null;
    }
}
