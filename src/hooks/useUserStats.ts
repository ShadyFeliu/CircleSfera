import { useCallback, useEffect, useState } from 'react';

export type UserStats = {
  totalChats: number;
  totalTime: number;
  countriesVisited: string[];
  favoriteInterests: string[];
  lastActive: Date;
};

const DEFAULT_STATS: UserStats = {
  totalChats: 0,
  totalTime: 0,
  countriesVisited: [],
  favoriteInterests: [],
  lastActive: new Date()
};

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  
  // Load stats from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('circleSfera_stats');
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      setStats({
        ...parsedStats,
        lastActive: new Date(parsedStats.lastActive)
      });
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('circleSfera_stats', JSON.stringify(stats));
  }, [stats]);

  const updateStats = useCallback((updates: Partial<UserStats>) => {
    setStats(current => ({
      ...current,
      ...updates,
      lastActive: new Date()
    }));
  }, []);

  const incrementChats = useCallback(() => {
    setStats(current => ({
      ...current,
      totalChats: current.totalChats + 1,
      lastActive: new Date()
    }));
  }, []);

  const addChatTime = useCallback((minutes: number) => {
    setStats(current => ({
      ...current,
      totalTime: current.totalTime + minutes,
      lastActive: new Date()
    }));
  }, []);

  const addInterest = useCallback((interest: string) => {
    setStats(current => {
      const interests = new Set([...current.favoriteInterests, interest]);
      return {
        ...current,
        favoriteInterests: Array.from(interests),
        lastActive: new Date()
      };
    });
  }, []);

  const addCountry = useCallback((country: string) => {
    setStats(current => {
      const countries = new Set([...current.countriesVisited, country]);
      return {
        ...current,
        countriesVisited: Array.from(countries),
        lastActive: new Date()
      };
    });
  }, []);

  const resetStats = useCallback(() => {
    setStats({
      ...DEFAULT_STATS,
      lastActive: new Date()
    });
    localStorage.removeItem('circleSfera_stats');
  }, []);

  return {
    stats,
    updateStats,
    incrementChats,
    addChatTime,
    addInterest,
    addCountry,
    resetStats
  };
};
