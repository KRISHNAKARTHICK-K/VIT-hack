// src/context/SocketContext.jsx - Real-Time Socket.IO Context Provider
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '/';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  const [reconnectCount, setReconnectCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef(null);

  // Initialize socket singleton
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 50,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SocketClient] Connected to server, ID:', socket.id);
      setIsConnected(true);
      setConnectionStatus('connected');

      // Register user persona if already logged in
      if (user) {
        socket.emit('register', {
          id: user.id,
          name: user.name,
          role: user.role,
          departmentName: user.departmentName || user.department
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('[SocketClient] Disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.warn('[SocketClient] Connect error:', error.message);
      setIsConnected(false);
      setConnectionStatus('connecting');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[SocketClient] Reconnected on attempt #', attemptNumber);
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectCount((prev) => prev + 1);

      if (user) {
        socket.emit('register', {
          id: user.id,
          name: user.name,
          role: user.role,
          departmentName: user.departmentName || user.department
        });
      }
    });

    // In-app real-time notification listener
    const handleIssueCreated = (data) => {
      if (!data?.issue) return;
      const title = `New Incident: ${data.issue.id} reported in ${data.issue.location}`;
      setNotifications((prev) => [
        {
          id: Date.now() + Math.random(),
          type: 'created',
          title: `Ticket ${data.issue.id} Logged`,
          message: `${data.issue.category} issue at ${data.issue.location}`,
          issueId: data.issue.id,
          timestamp: new Date().toISOString(),
          read: false
        },
        ...prev.slice(0, 49)
      ]);
      setUnreadCount((c) => c + 1);

      if (user?.role === 'ADMIN') {
        showToast(title, 'info');
      }
    };

    const handleIssueUpdated = (data) => {
      if (!data?.issue) return;
      const stage = data.stage || data.issue.status;
      setNotifications((prev) => [
        {
          id: Date.now() + Math.random(),
          type: 'updated',
          title: `Ticket ${data.issue.id} -> ${stage}`,
          message: `Status updated to ${stage}`,
          issueId: data.issue.id,
          timestamp: new Date().toISOString(),
          read: false
        },
        ...prev.slice(0, 49)
      ]);
      setUnreadCount((c) => c + 1);
    };

    const handleIssueResolved = (data) => {
      if (!data?.issue) return;
      if (user?.role === 'STUDENT' && data.issue.reportedBy?.id === user?.id) {
        showToast(`Work Order ${data.issue.id} marked as RESOLVED! Please confirm closure.`, 'success', 6000);
      }
    };

    socket.on('issue:created', handleIssueCreated);
    socket.on('issue:updated', handleIssueUpdated);
    socket.on('issue:resolved', handleIssueResolved);

    return () => {
      socket.off('issue:created', handleIssueCreated);
      socket.off('issue:updated', handleIssueUpdated);
      socket.off('issue:resolved', handleIssueResolved);
      socket.disconnect();
    };
  }, []);

  // Update socket registration on user change
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && user) {
      socketRef.current.emit('register', {
        id: user.id,
        name: user.name,
        role: user.role,
        departmentName: user.departmentName || user.department
      });
    }
  }, [user]);

  const joinIssueRoom = useCallback((issueId) => {
    if (socketRef.current && issueId) {
      socketRef.current.emit('join:issue', issueId);
    }
  }, []);

  const leaveIssueRoom = useCallback((issueId) => {
    if (socketRef.current && issueId) {
      socketRef.current.emit('leave:issue', issueId);
    }
  }, []);

  const subscribe = useCallback((eventName, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        connectionStatus,
        reconnectCount,
        notifications,
        unreadCount,
        joinIssueRoom,
        leaveIssueRoom,
        subscribe,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
