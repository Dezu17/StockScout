namespace StockScout.Api.Models;

public class Watchlist
{
    public int WatchlistID { get; set; }
    public string UserID { get; set; } = string.Empty;
    public string StockSymbol { get; set; } = string.Empty;
}
