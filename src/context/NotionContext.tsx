import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface NotionContextType {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

const NotionContext = createContext<NotionContextType | undefined>(undefined);

export const NotionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnectedState] = useState<boolean>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem('notionConnected');
    return stored === 'true';
  });

  const setIsConnected = useCallback((connected: boolean) => {
    setIsConnectedState(connected);
    localStorage.setItem('notionConnected', connected.toString());
  }, []);

  useEffect(() => {
    // Optionally check with backend on mount
    const checkConnectionStatus = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/notion/status`);
        const data = await response.json();
        if (data.connected) {
          setIsConnected(true);
        }
      } catch (error) {
        console.log('Could not check Notion connection status');
      }
    };

    checkConnectionStatus();
  }, [setIsConnected]);

  return (
    <NotionContext.Provider value={{ isConnected, setIsConnected }}>
      {children}
    </NotionContext.Provider>
  );
};

export const useNotion = () => {
  const context = useContext(NotionContext);
  if (context === undefined) {
    throw new Error('useNotion must be used within a NotionProvider');
  }
  return context;
};

