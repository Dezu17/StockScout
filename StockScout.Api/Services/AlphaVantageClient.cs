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
}
