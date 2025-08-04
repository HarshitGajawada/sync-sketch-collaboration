import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      console.log('Creating socket connection for user:', user.username);
      const newSocket = io('http://localhost:8000', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected to server, ID:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected from server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  }, [token, user]);

  const value = {
    socket,
    connected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};