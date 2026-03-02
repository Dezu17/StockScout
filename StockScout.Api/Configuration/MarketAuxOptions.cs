namespace StockScout.Api.Configuration;

public class MarketAuxOptions
{
    public string? ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://api.marketaux.com/v1";
    public int CacheTtlSeconds { get; set; } = 300;
}
