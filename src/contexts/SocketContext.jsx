import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import config from '../config/config';

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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [activeConnections, setActiveConnections] = useState([]);

  useEffect(() => {
    // Initialize socket connection
    const initializeSocket = () => {
      const token = localStorage.getItem('token');
      
      const socketInstance = io(config.API_BASE_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        extraHeaders: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      // Connection event handlers
      socketInstance.on('connect', () => {
        console.log('Admin Socket connected:', socketInstance.id);
        console.log('Admin Socket auth:', socketInstance.auth);
        setIsConnected(true);
        setConnectionError(null);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Admin Socket disconnected:', reason);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Admin Socket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('Admin Socket error:', error);
        setConnectionError(error.message);
      });

      // Support-related event handlers
      socketInstance.on('new_message', (data) => {
        console.log('New message received:', data);
        // Handle new chat messages
        if (window.showNotification) {
          window.showNotification({
            type: 'info',
            message: `New message from ${data.senderName}`,
            duration: 5000
          });
        }
      });

      socketInstance.on('user_joined', (data) => {
        console.log('User joined:', data);
        // Handle user joining chat
        if (window.showNotification) {
          window.showNotification({
            type: 'info',
            message: `${data.userName} joined the chat`,
            duration: 3000
          });
        }
      });

      socketInstance.on('user_left', (data) => {
        console.log('User left:', data);
        // Handle user leaving chat
      });

      socketInstance.on('typing_start', (data) => {
        console.log('User typing:', data);
        // Handle typing indicators
      });

      socketInstance.on('typing_stop', (data) => {
        console.log('User stopped typing:', data);
        // Handle typing stop
      });

      socketInstance.on('messages_read', (data) => {
        console.log('Messages read:', data);
        // Handle read receipts
      });

      socketInstance.on('room_joined', (data) => {
        console.log('Room joined:', data);
        // Handle room join confirmation
      });

      socketInstance.on('pong', () => {
        // Handle ping/pong for connection health
      });

      // Test socket connection
      socketInstance.on('connect', () => {
        console.log('Admin Socket connected successfully:', socketInstance.id);
        console.log('Admin Socket auth:', socketInstance.auth);
        console.log('Admin Socket connected to:', config.API_BASE_URL);
      });

      setSocket(socketInstance);
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []);

  // Socket utility functions
  const joinSupportRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join_support_room', { roomId });
    }
  };

  const sendMessage = (roomId, message, messageType = 'text') => {
    if (socket && isConnected) {
      socket.emit('send_message', { roomId, message, messageType });
    }
  };

  const startTyping = (roomId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { roomId });
    }
  };

  const markMessagesRead = (roomId) => {
    if (socket && isConnected) {
      socket.emit('mark_messages_read', { roomId });
    }
  };

  const updateQueryStatus = (queryId, status, response = null) => {
    if (socket && isConnected) {
      socket.emit('query_status_update', { queryId, status, response });
    }
  };

  const updateTicketStatus = (ticketId, status, message = null) => {
    if (socket && isConnected) {
      socket.emit('ticket_status_update', { ticketId, status, message });
    }
  };

  const ping = () => {
    if (socket && isConnected) {
      socket.emit('ping');
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    activeConnections,
    joinSupportRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesRead,
    updateQueryStatus,
    updateTicketStatus,
    ping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
