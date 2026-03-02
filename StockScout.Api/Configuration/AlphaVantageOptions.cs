namespace StockScout.Api.Configuration;

public class AlphaVantageOptions
{
    public string? ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://www.alphavantage.co";
    public int CacheTtlSeconds { get; set; }
}
