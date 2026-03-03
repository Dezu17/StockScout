using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using StockScout.Api.Configuration;
using StockScout.Api.Services;
using Xunit;

namespace StockScout.Api.Tests;

public class AlphaVantageClientTests
{
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
    private readonly IMemoryCache _cache;
    private readonly AlphaVantageOptions _options;

    private const string ValidQuoteJson = """
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

    public AlphaVantageClientTests()
    {
        _httpClientFactoryMock = new Mock<IHttpClientFactory>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _options = new AlphaVantageOptions
        {
            ApiKey = "test-api-key",
            BaseUrl = "https://test.alphavantage.co",
            CacheTtlSeconds = 60
        };
    }

    private AlphaVantageClient CreateClient()
    {
        return new AlphaVantageClient(
            _httpClientFactoryMock.Object,
            Options.Create(_options),
            _cache);
    }

    private void SetupHttpResponse(HttpStatusCode statusCode, string content)
    {
        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = statusCode,
                Content = new StringContent(content)
            });

        var httpClient = new HttpClient(handlerMock.Object);
        _httpClientFactoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);
    }

    [Fact]
    public async Task GetQuoteAsync_ReturnsQuote_ForValidResponse()
    {
        SetupHttpResponse(HttpStatusCode.OK, ValidQuoteJson);
        var client = CreateClient();

        var result = await client.GetQuoteAsync("MSFT");

        result.Should().NotBeNull();
        result!.Symbol.Should().Be("MSFT");
        result.Price.Should().Be(402.34m);
    }

    [Fact]
    public async Task GetQuoteAsync_ReturnsCachedQuote_OnSecondCall()
    {
        SetupHttpResponse(HttpStatusCode.OK, ValidQuoteJson);
        var client = CreateClient();

        // First call - hits HTTP
        var result1 = await client.GetQuoteAsync("MSFT");

        // Change response to error - if cache works, second call won't hit HTTP
        SetupHttpResponse(HttpStatusCode.InternalServerError, "");

        // Second call - should return cached value
        var result2 = await client.GetQuoteAsync("MSFT");

        result1.Should().NotBeNull();
        result2.Should().NotBeNull();
        result2!.Symbol.Should().Be("MSFT");
    }

    [Fact]
    public async Task GetQuoteAsync_ThrowsException_WhenApiKeyMissing()
    {
        _options.ApiKey = null;
        var client = CreateClient();

        var act = async () => await client.GetQuoteAsync("MSFT");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*ApiKey not configured*");
    }

    [Fact]
    public async Task GetQuoteAsync_ReturnsNull_WhenHttpFails()
    {
        SetupHttpResponse(HttpStatusCode.InternalServerError, "");
        var client = CreateClient();

        var result = await client.GetQuoteAsync("MSFT");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetQuoteAsync_ReturnsNull_WhenGlobalQuoteMissing()
    {
        SetupHttpResponse(HttpStatusCode.OK, """{ "Note": "API limit reached" }""");
        var client = CreateClient();

        var result = await client.GetQuoteAsync("INVALID");

        result.Should().BeNull();
    }
}
