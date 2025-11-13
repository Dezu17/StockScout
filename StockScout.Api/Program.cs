using System.Text.Json;
using System.Text.Json.Serialization;
using StockScout.Api;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<AlphaVantageOptions>(builder.Configuration.GetSection("AlphaVantage"));
builder.Services.AddSingleton<AlphaVantageClient>();

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

app.MapGet("/api/health", () => new { status = "ok", timeUtc = DateTime.UtcNow })
    .WithName("Health");

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
}

public class AlphaVantageClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AlphaVantageOptions _options;

    public AlphaVantageClient(IHttpClientFactory httpClientFactory, Microsoft.Extensions.Options.IOptions<AlphaVantageOptions> options)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
    }

    public async Task<QuoteDto?> GetQuoteAsync(string symbol, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_options.ApiKey))
            throw new InvalidOperationException("AlphaVantage ApiKey not configured. Set AlphaVantage:ApiKey in appsettings or environment (ALPHAVANTAGE__APIKEY).");

        var url = $"{_options.BaseUrl}/query?function=GLOBAL_QUOTE&symbol={Uri.EscapeDataString(symbol)}&apikey={_options.ApiKey}";
        var client = _httpClientFactory.CreateClient();
        using var resp = await client.GetAsync(url, ct);
        if (!resp.IsSuccessStatusCode) return null;
        await using var s = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(s, cancellationToken: ct);
        return QuoteMapper.MapFromGlobalQuote(doc);
    }
}
