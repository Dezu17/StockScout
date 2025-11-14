using System.Text.Json;

namespace StockScout.Api;

public static class QuoteMapper
{
    public static QuoteDto? MapFromGlobalQuote(JsonDocument doc)
    {
        if (!doc.RootElement.TryGetProperty("Global Quote", out var quoteElement)) return null;

        string GetString(string name) => quoteElement.TryGetProperty(name, out var v) ? v.GetString() ?? string.Empty : string.Empty;
        decimal? GetDecimal(string name) => decimal.TryParse(GetString(name), out var d) ? d : null;
        long? GetLong(string name) => long.TryParse(GetString(name), out var l) ? l : null;
        DateTime? GetDate(string name) => DateTime.TryParse(GetString(name), out var dt) ? DateTime.SpecifyKind(dt, DateTimeKind.Utc) : null;

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
