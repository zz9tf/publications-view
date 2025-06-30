"use client";

// 组合providers
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UrlItemProvider } from "@/contexts/UrlItemContext";

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <ProviderBridge>{children}</ProviderBridge>
    </AuthProvider>
  );
};

// 桥接组件，同时处理WebSocket和Patient Provider
const ProviderBridge = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();

  return (
    <WebSocketProvider isAuthenticated={state.isAuthenticated}>
      <UrlItemProvider isAuthenticated={state.isAuthenticated}>
        {children}
      </UrlItemProvider>
    </WebSocketProvider>
  );
};
