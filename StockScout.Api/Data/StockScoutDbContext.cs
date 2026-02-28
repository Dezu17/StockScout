using Microsoft.EntityFrameworkCore;
using StockScout.Api.Models;

namespace StockScout.Api.Data;

public class StockScoutDbContext : DbContext
{
    public StockScoutDbContext(DbContextOptions<StockScoutDbContext> options) : base(options) { }

    public DbSet<Watchlist> Watchlists => Set<Watchlist>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Watchlist>()
            .HasIndex(w => new { w.UserID, w.StockSymbol })
            .IsUnique();
    }
}
