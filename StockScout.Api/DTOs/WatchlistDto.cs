using System.ComponentModel.DataAnnotations;

namespace StockScout.Api.DTOs;

public record WatchlistItemDto(string Symbol);

public record AddSymbolRequest([Required] [StringLength(10, MinimumLength = 2)] string Symbol);