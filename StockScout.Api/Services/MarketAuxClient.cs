using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using StockScout.Api.Configuration;
using StockScout.Api.DTOs;

namespace StockScout.Api.Services;

public class MarketAuxClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly MarketAuxOptions _options;
    private readonly IMemoryCache _cache;

    public MarketAuxClient(IHttpClientFactory httpClientFactory, IOptions<MarketAuxOptions> options, IMemoryCache cache)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _cache = cache;
    }

    public async Task<List<NewsArticleDto>> GetNewsAsync(string? symbols = null, int limit = 3, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(symbols))
            return new List<NewsArticleDto>();

        if (string.IsNullOrEmpty(_options.ApiKey))
            throw new InvalidOperationException("MarketAux ApiKey not configured. Set MarketAux:ApiKey in appsettings or environment (MARKETAUX__APIKEY).");

        var cacheKey = $"news:{symbols}:{limit}";
        if (_cache.TryGetValue(cacheKey, out List<NewsArticleDto>? cachedData) && cachedData is not null)
            return cachedData;

        var url = $"{_options.BaseUrl}/news/all?api_token={_options.ApiKey}&language=en&limit={limit}&symbols={Uri.EscapeDataString(symbols)}";

        var client = _httpClientFactory.CreateClient();
        using var resp = await client.GetAsync(url, ct);
        if (!resp.IsSuccessStatusCode)
            return new List<NewsArticleDto>();

        await using var s = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(s, cancellationToken: ct);

        var articles = new List<NewsArticleDto>();
        if (doc.RootElement.TryGetProperty("data", out var dataArray))
        {
            foreach (var item in dataArray.EnumerateArray())
            {
                var uuid = item.GetProperty("uuid").GetString() ?? "";
                var title = item.GetProperty("title").GetString() ?? "";
                var description = item.TryGetProperty("description", out var desc) ? desc.GetString() : null;
                var articleUrl = item.GetProperty("url").GetString() ?? "";
                var imageUrl = item.TryGetProperty("image_url", out var img) ? img.GetString() : null;
                var publishedAtStr = item.GetProperty("published_at").GetString();
                var publishedAt = DateTime.TryParse(publishedAtStr, out var dt) ? dt : DateTime.UtcNow;
                var source = item.GetProperty("source").GetString() ?? "";

                articles.Add(new NewsArticleDto(uuid, title, description, articleUrl, imageUrl, publishedAt, source));
            }
        }

        _cache.Set(cacheKey, articles, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(Math.Max(1, _options.CacheTtlSeconds))
        });

        return articles;
    }
}
