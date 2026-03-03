using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockScout.Api.Controllers;
using StockScout.Api.Data;
using StockScout.Api.DTOs;
using StockScout.Api.Models;
using Xunit;

namespace StockScout.Api.Tests;

public class WatchlistControllerTests : IDisposable
{
    private readonly StockScoutDbContext _db;
    private readonly WatchlistController _controller;
    private const string TestUserId = "test-user";
    private const string OtherUserId = "other-user";

    public WatchlistControllerTests()
    {
        var options = new DbContextOptionsBuilder<StockScoutDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new StockScoutDbContext(options);
        _controller = new WatchlistController(_db);
        SetupUser(TestUserId);
    }

    private void SetupUser(string userId)
    {
        var claims = new List<Claim> { new("user_id", userId) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task GetUserWatchList_ReturnsEmptyList_WhenNoItems()
    {
        var result = await _controller.GetUserWatchList();

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var items = okResult.Value.Should().BeAssignableTo<IEnumerable<WatchlistItemDto>>().Subject;
        items.Should().BeEmpty();
    }

    [Fact]
    public async Task GetUserWatchList_ReturnsOnlyCurrentUserItems()
    {
        // Arrange - Add items for test user and other user
        _db.Watchlists.AddRange(
            new Watchlist { UserID = TestUserId, StockSymbol = "MSFT" },
            new Watchlist { UserID = TestUserId, StockSymbol = "AAPL" },
            new Watchlist { UserID = OtherUserId, StockSymbol = "GOOG" }
        );
        await _db.SaveChangesAsync();

        // Act
        var result = await _controller.GetUserWatchList();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var items = okResult.Value.Should().BeAssignableTo<IEnumerable<WatchlistItemDto>>().Subject.ToList();
        items.Should().HaveCount(2);
        items.Select(i => i.Symbol).Should().Contain(new[] { "MSFT", "AAPL" });
        items.Select(i => i.Symbol).Should().NotContain("GOOG");
    }

    [Fact]
    public async Task AddSymbol_CreatesItem_WhenNew()
    {
        var request = new AddSymbolRequest("tsla");

        var result = await _controller.AddStockSymbolToUserWatchlist(request);

        result.Result.Should().BeOfType<CreatedAtActionResult>();
        var item = await _db.Watchlists.FirstOrDefaultAsync(w => w.UserID == TestUserId && w.StockSymbol == "TSLA");
        item.Should().NotBeNull();
    }

    [Fact]
    public async Task AddSymbol_ReturnsConflict_WhenDuplicate()
    {
        // Arrange - Add existing item
        _db.Watchlists.Add(new Watchlist { UserID = TestUserId, StockSymbol = "MSFT" });
        await _db.SaveChangesAsync();

        var request = new AddSymbolRequest("msft");

        // Act
        var result = await _controller.AddStockSymbolToUserWatchlist(request);

        // Assert
        result.Result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task RemoveSymbol_DeletesItem_WhenExists()
    {
        // Arrange
        _db.Watchlists.Add(new Watchlist { UserID = TestUserId, StockSymbol = "AAPL" });
        await _db.SaveChangesAsync();

        // Act
        var result = await _controller.RemoveSymbolFromUserWatchlist("AAPL");

        // Assert
        result.Should().BeOfType<NoContentResult>();
        var item = await _db.Watchlists.FirstOrDefaultAsync(w => w.StockSymbol == "AAPL");
        item.Should().BeNull();
    }

    [Fact]
    public async Task RemoveSymbol_ReturnsNotFound_WhenMissing()
    {
        var result = await _controller.RemoveSymbolFromUserWatchlist("NVDA");

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task RemoveSymbol_DoesNotDeleteOtherUsersItem()
    {
        // Arrange - Add item for different user
        _db.Watchlists.Add(new Watchlist { UserID = OtherUserId, StockSymbol = "GOOG" });
        await _db.SaveChangesAsync();

        // Act
        var result = await _controller.RemoveSymbolFromUserWatchlist("GOOG");

        // Assert
        result.Should().BeOfType<NotFoundResult>();
        var item = await _db.Watchlists.FirstOrDefaultAsync(w => w.StockSymbol == "GOOG");
        item.Should().NotBeNull(); // Item should still exist
    }
}
