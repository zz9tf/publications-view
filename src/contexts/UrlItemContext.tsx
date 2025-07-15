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
import { EventData, URLItem, WS_EVENTS } from "@/types";

// 定义上下文的类型
interface UrlItemContextType {
  urlItems: URLItem[];
  isLoading: boolean;
  error: string | null;
  fetchUrlItem: (url: string, searchId: string) => void;
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
  const { subscribeToEvent, clientId, sendMessage } = useWebSocket();

  // 获取收件箱条目
  const fetchUrlItem = useCallback(
    (url: string, searchId: string) => {
      if (!isAuthenticated) {
        setUrlItems([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        sendMessage(WS_EVENTS.START_FETCH_A_GOOGLE_SCHOLAR_URL, {
          url,
          searchId,
          clientId,
        });

        const newUrlItem: URLItem = {
          search_id: searchId,
          client_id: clientId || "",
          url,
          author_name: url,
          status: "collecting_info",
          progress: 0,
          fetched_paper_count: null,
          total_paper_count: null,
          papers_urls: [],
          papers: [],
          error_message: "",
          start_time: new Date().toISOString(),
          thread_id: 0,
        };
        console.log("newUrlItem:", newUrlItem);

        setUrlItems((prev: URLItem[]) => [...prev, newUrlItem]);
      } catch (err) {
        console.error("Error fetching inbox items:", err);
        setError("Failed to load inbox items");
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, clientId, sendMessage]
  );

  const removeUrlItem = useCallback(
    async (searchId: string) => {
      setUrlItems((prev) => prev.filter((item) => item.search_id !== searchId));
    },
    [setUrlItems]
  );

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateFetchAGoogleScholarUrlProcess = (data: EventData) => {
    console.log("updateFetchAGoogleScholarUrlProcess:", data);
    setUrlItems((prev: URLItem[]) =>
      prev.map((item) =>
        item.search_id === data.search_id ? (data as unknown as URLItem) : item
      )
    );
  };

  const fetchedCompletedWithPapersInfo = (data: EventData) => {
    console.log("fetchedCompletedWithPapersInfo:", data);
    setUrlItems((prev: URLItem[]) =>
      prev.map((item) =>
        item.search_id === data.search_id ? (data as unknown as URLItem) : item
      )
    );
  };

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
    const unsubscribeUpdateFetchAGoogleScholarUrlProcess = subscribeToEvent(
      WS_EVENTS.UPDATE_FETCH_A_GOOGLE_SCHOLAR_URL_PROCESS,
      updateFetchAGoogleScholarUrlProcess
    );

    const unsubscribeFetchedCompletedWithPapersInfo = subscribeToEvent(
      WS_EVENTS.FETCHED_COMPLETED_WITH_PAPERS_INFO,
      fetchedCompletedWithPapersInfo
    );

    // 组件卸载时取消订阅
    return () => {
      unsubscribeUpdateFetchAGoogleScholarUrlProcess();
      unsubscribeFetchedCompletedWithPapersInfo();
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
