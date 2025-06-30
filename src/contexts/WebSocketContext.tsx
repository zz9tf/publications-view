"use client";

// 专注于WebSocket连接管理
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { EventData, WebSocketMessage, WS_EVENTS } from "@/types";

interface WebSocketContextType {
  isConnected: boolean;
  clientId: string | null;
  sendMessage: (event: string, data: EventData) => string;
  subscribeToEvent: (
    event: string,
    callback: (data: EventData) => void
  ) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context)
    throw new Error("useWebSocket must be used within WebSocketProvider");
  return context;
};

export const WebSocketProvider = ({
  children,
  endpoint = process.env.NODE_ENV === "production"
    ? `ws://${process.env.NEXT_PUBLIC_API_URL}/ws`
    : "ws://localhost:8000/api/ws",
  isAuthenticated = false,
}: {
  children: React.ReactNode;
  endpoint?: string;
  isAuthenticated?: boolean;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const eventListenersRef = useRef<Map<string, Set<(data: EventData) => void>>>(
    new Map()
  );
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket连接逻辑
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      const socket = new WebSocket(endpoint);
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        setIsConnected(true);
        console.log("WebSocket connected, waiting for client_id...");
      });

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;

          // 检查是否是客户端ID确认消息
          if (
            message.event === WS_EVENTS.CLIENT_CONNECTED &&
            message.data.client_id
          ) {
            setClientId(message.data.client_id as string);
            console.log("Client ID received:", message.data.client_id);
            return;
          }

          // 处理其他事件
          eventListenersRef.current.get(message.event)?.forEach((callback) => {
            try {
              callback(message.data);
            } catch (error) {
              console.error(
                `Error in event listener for ${message.event}:`,
                error
              );
            }
          });
        } catch (error) {
          console.error("Message parse error:", error);
        }
      });

      socket.addEventListener("error", () => {
        setIsConnected(false);
        setClientId(null);
      });

      socket.addEventListener("close", (event) => {
        setIsConnected(false);
        setClientId(null);

        const isUserInitiated =
          event.code === 1000 && event.reason === "User initiated disconnect";

        if (!isUserInitiated && isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      });
    } catch {
      setIsConnected(false);
      setClientId(null);
      if (isAuthenticated) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }
  }, [endpoint, isAuthenticated]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close(1000, "User initiated disconnect");
      socketRef.current = null;
      setIsConnected(false);
      setClientId(null);
    }
  }, []);

  // 认证状态变化时连接或断开
  useEffect(() => {
    if (isAuthenticated && !isConnected) {
      connect();
    } else if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, isConnected, connect, disconnect]);

  // WebSocket API
  const sendMessage = useCallback((event: string, data: EventData): string => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    const messageId = Date.now().toString();
    socketRef.current.send(JSON.stringify({ event, data, messageId }));
    return messageId;
  }, []);

  // 事件订阅机制
  const subscribeToEvent = useCallback(
    (event: string, callback: (data: EventData) => void) => {
      let listeners = eventListenersRef.current.get(event);

      if (!listeners) {
        listeners = new Set();
        eventListenersRef.current.set(event, listeners);
      }

      listeners.add(callback);

      return () => {
        const listeners = eventListenersRef.current.get(event);
        if (listeners) {
          listeners.delete(callback);
          if (listeners.size === 0) {
            eventListenersRef.current.delete(event);
          }
        }
      };
    },
    []
  );

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        clientId,
        sendMessage,
        subscribeToEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
