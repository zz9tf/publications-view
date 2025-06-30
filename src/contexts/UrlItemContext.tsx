import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import Cookies from "js-cookie";
import { useWebSocket } from "./WebSocketContext";
import { API_PATHS, GoogleSearchRequest, URLItem, WS_EVENTS } from "@/types";

// 定义上下文的类型
interface UrlItemContextType {
  urlItems: URLItem[];
  isLoading: boolean;
  error: string | null;
  fetchUrlItem: (url: string, searchId: string) => Promise<void>;
  clearError: () => void;
  removeUrlItem: (searchId: string) => Promise<void>;
}

// 创建上下文
const UrlItemContext = createContext<UrlItemContextType | undefined>(undefined);

// 常量配置
const TOKEN_COOKIE_KEY =
  process.env.NEXT_PUBLIC_TOKEN_COOKIE_KEY || "pet_client_token";

// 创建axios实例
const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_API_URL
      : "http://localhost:8000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器：添加token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(TOKEN_COOKIE_KEY);
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove(TOKEN_COOKIE_KEY);
    }
    return Promise.reject(error);
  }
);

// 创建提供者组件
export const UrlItemProvider: React.FC<{
  children: ReactNode;
  isAuthenticated?: boolean;
}> = ({ children, isAuthenticated = false }) => {
  const [urlItems, setUrlItems] = useState<URLItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subscribeToEvent, clientId } = useWebSocket();

  // 获取收件箱条目
  const fetchUrlItem = useCallback(
    async (url: string, searchId: string) => {
      if (!isAuthenticated) {
        setUrlItems([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post(API_PATHS.FETCH_URL_ITEM, {
          url,
          searchId,
          clientId,
        } as GoogleSearchRequest);
        const urlItem = {
          searchId,
          url,
          shortDescription: response.data.data.short_description,
          progress: response.data.data.progress,
          status: response.data.data.status,
          fetchedPaperCount: response.data.data.fetched_paper_count,
          totalPaperCount: response.data.data.total_paper_count,
        } as URLItem;
        setUrlItems((prev) => [...prev, urlItem]);
      } catch (err) {
        console.error("Error fetching inbox items:", err);
        setError("Failed to load inbox items");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, clientId]
  );

  const removeUrlItem = useCallback(
    async (searchId: string) => {
      setUrlItems((prev) => prev.filter((item) => item.searchId !== searchId));
    },
    [setUrlItems]
  );

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 当认证状态或日期过滤器改变时获取数据
  useEffect(() => {
    if (!isAuthenticated) {
      setUrlItems([]);
      setError(null);
    }
  }, [isAuthenticated]);

  // 监听WebSocket事件，当收到转录完成事件时自动刷新数据
  useEffect(() => {
    if (!isAuthenticated) return;

    // 订阅转录完成事件
    const unsubscribe = subscribeToEvent(
      WS_EVENTS.UPDATE_URL_ITEM_FETCHING_PROCESS,
      (data) => {
        console.log("UrlItem:", data);
      }
    );

    // 组件卸载时取消订阅
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, subscribeToEvent]); // 🔥 更新依赖

  return (
    <UrlItemContext.Provider
      value={{
        urlItems,
        isLoading,
        error,
        fetchUrlItem,
        clearError,
        removeUrlItem,
      }}
    >
      {children}
    </UrlItemContext.Provider>
  );
};

// 创建一个钩子来使用上下文
export const useUrlItem = (): UrlItemContextType => {
  const context = useContext(UrlItemContext);
  if (!context) {
    throw new Error("useUrlItem must be used within an UrlItemProvider");
  }
  return context;
};
