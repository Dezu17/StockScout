import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut, getIdToken } from 'firebase/auth';

interface AuthenticationContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthenticationContext = createContext<AuthenticationContextType>({
  user: null,
  loading: true,
  token: null,
  refreshToken: async () => {},
  logout: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = async (currentUser: User | null) => {
    if (!currentUser) {
      setToken(null);
      return;
    }
    try {
      const idToken = await getIdToken(currentUser, true);
      setToken(idToken);
    } catch (error) {
      console.error('Error fetching token:', error);
      setToken(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await fetchToken(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshToken = async () => {
    await fetchToken(user);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthenticationContext.Provider value={{ user, loading, token, refreshToken, logout }}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export const useAuth = () => useContext(AuthenticationContext);
