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

public class MarketAuxClientTests
{
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
    private readonly IMemoryCache _cache;
    private readonly MarketAuxOptions _options;

    private const string ValidNewsJson = """
        {
          "data": [
            {
              "uuid": "article-1",
              "title": "Microsoft reports strong earnings",
              "description": "Tech stocks rally",
              "url": "https://news.example.com/article1",
              "image_url": "https://news.example.com/image1.jpg",
              "published_at": "2024-11-12T10:00:00Z",
              "source": "Financial Times"
            },
            {
              "uuid": "article-2",
              "title": "Apple announces new product",
              "description": null,
              "url": "https://news.example.com/article2",
              "published_at": "2024-11-12T09:00:00Z",
              "source": "Reuters"
            }
          ]
        }
        """;

    public MarketAuxClientTests()
    {
        _httpClientFactoryMock = new Mock<IHttpClientFactory>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _options = new MarketAuxOptions
        {
            ApiKey = "test-api-key",
            BaseUrl = "https://test.marketaux.com/v1",
            CacheTtlSeconds = 60
        };
    }

    private MarketAuxClient CreateClient()
    {
        return new MarketAuxClient(
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
    public async Task GetNewsAsync_ReturnsEmptyList_WhenSymbolsNull()
    {
        var client = CreateClient();

        var result = await client.GetNewsAsync(null);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetNewsAsync_ReturnsEmptyList_WhenSymbolsEmpty()
    {
        var client = CreateClient();

        var result = await client.GetNewsAsync("");

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetNewsAsync_ParsesArticlesCorrectly()
    {
        SetupHttpResponse(HttpStatusCode.OK, ValidNewsJson);
        var client = CreateClient();

        var result = await client.GetNewsAsync("MSFT,AAPL");

        result.Should().HaveCount(2);
        
        var firstArticle = result[0];
        firstArticle.Uuid.Should().Be("article-1");
        firstArticle.Title.Should().Be("Microsoft reports strong earnings");
        firstArticle.Description.Should().Be("Tech stocks rally");
        firstArticle.Url.Should().Be("https://news.example.com/article1");
        firstArticle.ImageUrl.Should().Be("https://news.example.com/image1.jpg");
        firstArticle.Source.Should().Be("Financial Times");

        var secondArticle = result[1];
        secondArticle.Uuid.Should().Be("article-2");
        secondArticle.Description.Should().BeNull();
    }

    [Fact]
    public async Task GetNewsAsync_UsesCacheOnRepeatedCalls()
    {
        SetupHttpResponse(HttpStatusCode.OK, ValidNewsJson);
        var client = CreateClient();

        // First call - hits HTTP
        var result1 = await client.GetNewsAsync("MSFT", 3);

        // Change response - if cache works, second call won't hit HTTP
        SetupHttpResponse(HttpStatusCode.InternalServerError, "");

        // Second call - should return cached value
        var result2 = await client.GetNewsAsync("MSFT", 3);

        result1.Should().HaveCount(2);
        result2.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetNewsAsync_ThrowsException_WhenApiKeyMissing()
    {
        _options.ApiKey = null;
        var client = CreateClient();

        var act = async () => await client.GetNewsAsync("MSFT");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*ApiKey not configured*");
    }

    [Fact]
    public async Task GetNewsAsync_ReturnsEmptyList_WhenHttpFails()
    {
        SetupHttpResponse(HttpStatusCode.InternalServerError, "");
        var client = CreateClient();

        var result = await client.GetNewsAsync("MSFT");

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetNewsAsync_ReturnsEmptyList_WhenNoDataProperty()
    {
        SetupHttpResponse(HttpStatusCode.OK, """{ "error": "something went wrong" }""");
        var client = CreateClient();

        var result = await client.GetNewsAsync("MSFT");

        result.Should().BeEmpty();
    }
}
