namespace StockScout.Api.DTOs;

public record NewsArticleDto(
    string Uuid,
    string Title,
    string? Description,
    string Url,
    string? ImageUrl,
    DateTime PublishedAt,
    string Source
);
