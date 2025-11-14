using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using StockScout.Api;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddMemoryCache();
builder.Services.Configure<AlphaVantageOptions>(builder.Configuration.GetSection("AlphaVantage"));
builder.Services.AddSingleton<AlphaVantageClient>();

// Firebase JWT authentication setup (only if ProjectId configured)
var firebaseProjectId = builder.Configuration["Firebase:ProjectId"];
if (!string.IsNullOrWhiteSpace(firebaseProjectId))
{
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
                ValidateAudience = true,
                ValidAudience = firebaseProjectId,
                ValidateLifetime = true
            };
        });
    builder.Services.AddAuthorization();
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", p => p
        .AllowAnyHeader()
        .AllowAnyMethod()
        .WithOrigins("http://localhost:5173"));
});

var app = builder.Build();

app.UseCors("dev");
app.UseSwagger();
app.UseSwaggerUI();

// Auth middleware (will noop if not configured above)
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => new { status = "ok", timeUtc = DateTime.UtcNow })
    .WithName("Health");

// Protected test endpoint to verify Firebase authentication
app.MapGet("/api/secure-test", (ClaimsPrincipal user) =>
{
    var email = user.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
    var userId = user.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
    return new { message = "authenticated", email, userId };
})
.RequireAuthorization()
.WithName("SecureTest");

app.MapGet("/api/quote/{symbol}", async (string symbol, AlphaVantageClient client) =>
{
    if (string.IsNullOrWhiteSpace(symbol)) return Results.BadRequest("Symbol required");
    var quote = await client.GetQuoteAsync(symbol.Trim().ToUpperInvariant());
    return quote is null ? Results.NotFound() : Results.Ok(quote);
})
.WithName("GetQuote");

app.Run();

// DTOs & service classes
public record QuoteDto(string Symbol, decimal Price, decimal? Open, decimal? High, decimal? Low, decimal? PreviousClose, decimal? Change, string? ChangePercent, long? Volume, DateTime? LatestTradingDay);

public class AlphaVantageOptions
{
    public string? ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://www.alphavantage.co";
    public int CacheTtlSeconds { get; set; }
}

public class AlphaVantageClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AlphaVantageOptions _options;
    private IMemoryCache _cache;

    public AlphaVantageClient(IHttpClientFactory httpClientFactory, Microsoft.Extensions.Options.IOptions<AlphaVantageOptions> options, IMemoryCache cache)
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
