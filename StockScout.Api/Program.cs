using System.Text.Json;
using System.Text.Json.Serialization;

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
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

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
        if (!doc.RootElement.TryGetProperty("Global Quote", out var quoteElement)) return null;

        string GetString(string name) => quoteElement.TryGetProperty(name, out var v) ? v.GetString() ?? string.Empty : string.Empty;

        decimal? GetDecimal(string name)
            => decimal.TryParse(GetString(name), out var d) ? d : null;
        long? GetLong(string name)
            => long.TryParse(GetString(name), out var l) ? l : null;
        DateTime? GetDate(string name)
            => DateTime.TryParse(GetString(name), out var dt) ? DateTime.SpecifyKind(dt, DateTimeKind.Utc) : null;

        var dto = new QuoteDto(
            Symbol: GetString("01. symbol"),
            Price: GetDecimal("05. price") ?? 0m,
            Open: GetDecimal("02. open"),
            High: GetDecimal("03. high"),
            Low: GetDecimal("04. low"),
            PreviousClose: GetDecimal("08. previous close"),
            Change: GetDecimal("09. change"),
            ChangePercent: GetString("10. change percent"),
            Volume: GetLong("06. volume"),
            LatestTradingDay: GetDate("07. latest trading day")
        );
        if (string.IsNullOrEmpty(dto.Symbol)) return null;
        return dto;
    }
}
