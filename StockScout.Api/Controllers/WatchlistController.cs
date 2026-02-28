using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockScout.Api.Data;
using StockScout.Api.DTOs;
using StockScout.Api.Models;

namespace StockScout.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WatchlistController : ControllerBase
{
    private readonly StockScoutDbContext database;

    public WatchlistController(StockScoutDbContext database) => this.database = database;

    private string GetUserID() =>
        User.FindFirstValue("user_id") ?? throw new UnauthorizedAccessException();

    //GET request to get all watchlist items for current user
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WatchlistItemDto>>> GetUserWatchList()
    {
        var userId = GetUserID();
        var watchlistItems = await database.Watchlists
            .Where(item => item.UserID == userId)
            .Select(item => new WatchlistItemDto(item.StockSymbol))
            .ToListAsync();
        return Ok(watchlistItems);
    }

    [HttpPost]
    public async Task<ActionResult<IEnumerable<WatchlistItemDto>>> AddStockSymbolToUserWatchlist([FromBody] AddSymbolRequest request)
    {
        var userID = GetUserID();
        var symbol = request.Symbol.Trim().ToUpperInvariant();

        if (await database.Watchlists.AnyAsync(element => element.UserID == userID && element.StockSymbol == symbol))
            return Conflict(new {message = "This symbol has already been added to the user's watchlist."});

        var newWatchlistItem = new Watchlist { UserID = userID, StockSymbol = symbol };
        database.Watchlists.Add(newWatchlistItem);
        await database.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUserWatchList), new WatchlistItemDto(newWatchlistItem.StockSymbol));
    }

    [HttpDelete("{symbol}")]
    public async Task<IActionResult> RemoveSymbolFromUserWatchlist(string symbol)
    {
        var userID = GetUserID();
        var itemToDelete = await database.Watchlists
            .FirstOrDefaultAsync(item => item.UserID == userID && item.StockSymbol == symbol.ToUpperInvariant());

        if (itemToDelete is null)
            return NotFound();

        database.Watchlists.Remove(itemToDelete);
        await database.SaveChangesAsync();
        return NoContent();
    }
}