const API_BASE = import.meta.env.VITE_API_BASE;

export const getUserWatchlist = async (token: string): Promise<string[]> => {
  const res = await fetch(`${API_BASE}/watchlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user's watchlist.");
  const data = await res.json();
  return data.map((item: { symbol: string }) => item.symbol);
};

export const addToUserWatchlist = async (token: string, symbol: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/watchlist`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) throw new Error(`Failed to add ${symbol} to user's watchlist.`);
};

export const removeFromUserWatchlist = async (token: string, symbol: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/watchlist/${symbol}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to remove ${symbol} from user's watchlist.`);
};