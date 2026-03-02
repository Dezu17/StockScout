using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using StockScout.Api;
using Microsoft.EntityFrameworkCore;
using StockScout.Api.Configuration;
using StockScout.Api.Data;
using StockScout.Api.DTOs;
using StockScout.Api.Services;
using DotNetEnv;

var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

// Add services
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddMemoryCache();
builder.Services.Configure<AlphaVantageOptions>(builder.Configuration.GetSection("AlphaVantage"));
builder.Services.AddSingleton<AlphaVantageClient>();
builder.Services.Configure<MarketAuxOptions>(builder.Configuration.GetSection("MarketAux"));
builder.Services.AddSingleton<MarketAuxClient>();

builder.Services.AddDbContext<StockScoutDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddControllers();


// Firebase JWT authentication setup (only if ProjectId configured)
var firebaseProjectId = builder.Configuration["Firebase:ProjectId"];
if (!string.IsNullOrWhiteSpace(firebaseProjectId))
{
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
                ValidateAudience = true,
                ValidAudience = firebaseProjectId,
                ValidateLifetime = true
            };
        });
    builder.Services.AddAuthorization();
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", p => p
        .AllowAnyHeader()
        .AllowAnyMethod()
        .WithOrigins("http://localhost:5173"));
});

var app = builder.Build();

app.UseCors("dev");
app.UseSwagger();
app.UseSwaggerUI();

// Auth middleware (will noop if not configured above)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/health", () => new { status = "ok", timeUtc = DateTime.UtcNow })
    .WithName("Health");

// Protected test endpoint to verify Firebase authentication
app.MapGet("/api/secure-test", (ClaimsPrincipal user) =>
{
    var email = user.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
    var userId = user.Claims.FirstOrDefault(c => c.Type == "user_id")?.Value;
    return new { message = "authenticated", email, userId };
})
.RequireAuthorization()
.WithName("SecureTest");

app.MapGet("/api/quote/{symbol}", async (string symbol, AlphaVantageClient client) =>
{
    if (string.IsNullOrWhiteSpace(symbol)) return Results.BadRequest("Symbol required");
    var quote = await client.GetQuoteAsync(symbol.Trim().ToUpperInvariant());
    return quote is null ? Results.NotFound() : Results.Ok(quote);
})
.WithName("GetQuote");

app.MapGet("/api/news", async (MarketAuxClient client, string? symbols, int? limit) =>
{
    var articles = await client.GetNewsAsync(symbols, limit ?? 3);
    return Results.Ok(articles);
})
.WithName("GetNews");

app.Run();
