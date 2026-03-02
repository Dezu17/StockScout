namespace StockScout.Api.DTOs;

public record QuoteDto(
    string Symbol,
    decimal Price,
    decimal? Open,
    decimal? High,
    decimal? Low,
    decimal? PreviousClose,
    decimal? Change,
    string? ChangePercent,
    long? Volume,
    DateTime? LatestTradingDay
);
