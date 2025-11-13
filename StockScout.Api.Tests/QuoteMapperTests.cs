using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace StockScout.Api.Tests;

public class QuoteMapperTests
{
    [Fact]
    public void MapFromGlobalQuote_ReturnsDto_ForValidPayload()
    {
        var json = """
        {
          "Global Quote": {
            "01. symbol": "MSFT",
            "02. open": "400.00",
            "03. high": "405.00",
            "04. low": "395.00",
            "05. price": "402.34",
            "06. volume": "123456",
            "07. latest trading day": "2024-11-12",
            "08. previous close": "401.00",
            "09. change": "1.34",
            "10. change percent": "0.33%"
          }
        }
        """;

        using var doc = JsonDocument.Parse(json);
        var dto = QuoteMapper.MapFromGlobalQuote(doc);

        dto.Should().NotBeNull();
        dto!.Symbol.Should().Be("MSFT");
        dto.Price.Should().Be(402.34m);
        dto.Open.Should().Be(400.00m);
        dto.High.Should().Be(405.00m);
        dto.Low.Should().Be(395.00m);
        dto.PreviousClose.Should().Be(401.00m);
        dto.Change.Should().Be(1.34m);
        dto.ChangePercent.Should().Be("0.33%");
        dto.Volume.Should().Be(123456);
        dto.LatestTradingDay.Should().NotBeNull();
        dto.LatestTradingDay!.Value.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void MapFromGlobalQuote_ReturnsNull_WhenGlobalQuoteMissing()
    {
        var json = "{ \"Meta Data\": { \"X\": \"Y\" } }";
        using var doc = JsonDocument.Parse(json);
        var dto = QuoteMapper.MapFromGlobalQuote(doc);
        dto.Should().BeNull();
    }

    [Fact]
    public void MapFromGlobalQuote_ReturnsNull_WhenSymbolMissing()
    {
        var json = """
        { "Global Quote": { "05. price": "10.00" } }
        """;
        using var doc = JsonDocument.Parse(json);
        var dto = QuoteMapper.MapFromGlobalQuote(doc);
        dto.Should().BeNull();
    }
}