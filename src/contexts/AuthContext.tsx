"use client";

// 专注于认证状态管理
import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import Cookies from "js-cookie";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  API_PATHS,
  UpdateAvatarRequest,
  AuthState,
  LoginResponse,
  RegisterResponse,
  TokenVerifyRequest,
  TokenVerifyResponse,
} from "@/types";

// 常量配置
const TOKEN_COOKIE_KEY =
  process.env.NEXT_PUBLIC_TOKEN_COOKIE_KEY || "publications_view_token";
const COOKIE_OPTIONS = {
  expires: 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

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

// 响应拦截器：保留完整响应结构
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove(TOKEN_COOKIE_KEY);
    }
    return Promise.reject(error);
  }
);

// 导出API实例以便其他地方使用
export { api };

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateUser: (user: User) => void;
  updateAvatar: (file: File) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  getToken: () => string | undefined;
  isAuthenticated: boolean;
  handleOAuthCallback: (
    token: string,
    user: string | null
  ) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    loginError: null,
    registerError: null,
    token: null,
  });

  const router = useRouter();

  // 状态更新方法
  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({
      ...prev,
      user,
      isAuthenticated: !!user,
    }));
  }, []);

  // 更新用户资料
  const updateUser = useCallback((user: User) => {
    setState((prev) => ({
      ...prev,
      user,
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  // 获取Token
  const getToken = useCallback(() => {
    return Cookies.get(TOKEN_COOKIE_KEY);
  }, []);

  // API方法
  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, loginError: null }));

    try {
      const data: LoginRequest = { email, password };
      const res = await api.post<ApiResponse<LoginResponse>>(
        API_PATHS.LOGIN,
        data
      );
      const response = res.data;

      if (response.success && response.data) {
        const { user, token } = response.data;
        Cookies.set(TOKEN_COOKIE_KEY, token, COOKIE_OPTIONS);

        setState((prev) => ({
          ...prev,
          user,
          token,
          isAuthenticated: true,
          loginError: null,
          isLoading: false,
        }));

        return true;
      } else {
        setState((prev) => ({
          ...prev,
          loginError: response.error || "Login failed",
          isLoading: false,
        }));
        return false;
      }
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        loginError:
          error instanceof Error ? error.message : "Login request failed",
        isLoading: false,
      }));
      return false;
    }
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, registerError: null }));

      try {
        const data: RegisterRequest = {
          username,
          email,
          password,
        };
        const res = await api.post<ApiResponse<RegisterResponse>>(
          API_PATHS.REGISTER,
          data
        );
        const response = res.data;

        if (response.success && response.data) {
          const { user, token } = response.data;
          Cookies.set(TOKEN_COOKIE_KEY, token, COOKIE_OPTIONS);

          setState((prev) => ({
            ...prev,
            user,
            token,
            isAuthenticated: true,
            registerError: null,
            isLoading: false,
          }));

          return true;
        } else {
          setState((prev) => ({
            ...prev,
            registerError: response.error || "Registration failed",
            isLoading: false,
          }));
          return false;
        }
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          registerError:
            error instanceof Error
              ? error.message
              : "Registration request failed",
          isLoading: false,
        }));
        return false;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await api.post(API_PATHS.LOGOUT);
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      Cookies.remove(TOKEN_COOKIE_KEY);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        loginError: null,
        registerError: null,
        token: null,
      });
      router.push("/");
    }
  }, [router]);

  // 更新头像
  const updateAvatar = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const token = getToken();
        if (!token) {
          throw new Error("Unauthorized");
        }

        // 将文件转换为 Base64 字符串
        const avatarBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const requestData: UpdateAvatarRequest = {
          token,
          avatar: avatarBase64,
        };

        const response = await api.post<ApiResponse<{ user: User }>>(
          API_PATHS.UPDATE_AVATAR,
          requestData
        );

        const result = response.data;
        if (result.success && result.data?.user) {
          updateUser(result.data.user);
        } else {
          throw new Error(result.error || "Update avatar failed");
        }
      } catch (error) {
        console.error("Update avatar failed:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getToken, updateUser, setLoading]
  );

  const handleOAuthCallback = useCallback(
    async (token: string, user: string | null) => {
      setLoading(true);

      try {
        if (!token) {
          throw new Error("Not receive authentication token");
        }

        // 存储令牌
        Cookies.set(TOKEN_COOKIE_KEY, token, COOKIE_OPTIONS);

        // 解析user参数或验证token获取用户信息
        let userData: User;

        if (user) {
          // 尝试解析URL中的user参数
          try {
            userData = JSON.parse(decodeURIComponent(user));
            setUser(userData);
          } catch {
            console.error("Failed to parse user data, using token to verify");
            // 解析失败时，使用token验证API获取用户数据
            const response = await api.post<ApiResponse<{ user: User }>>(
              API_PATHS.VERIFY_TOKEN,
              { token }
            );
            if (response.data.success && response.data.data?.user) {
              userData = response.data.data.user;
              setUser(userData);
            } else {
              throw new Error("Token verification failed");
            }
          }
        } else {
          // 没有user参数时，使用验证API获取用户数据
          const response = await api.post<ApiResponse<{ user: User }>>(
            API_PATHS.VERIFY_TOKEN,
            { token }
          );
          if (
            response.data.success &&
            response.data.data &&
            response.data.data.user
          ) {
            userData = response.data.data.user;
            setUser(userData);
          } else {
            throw new Error("Token verification failed");
          }
        }

        return { success: true, user: userData };
      } catch (error: unknown) {
        console.error("Error processing OAuth callback:", error);
        Cookies.remove(TOKEN_COOKIE_KEY);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Authentication process failed",
        };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  // 初始化：检查token并获取用户信息
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      try {
        const token = Cookies.get(TOKEN_COOKIE_KEY);
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // 验证token并获取用户信息
        try {
          const res = await api.post<ApiResponse<TokenVerifyResponse>>(
            API_PATHS.VERIFY_TOKEN,
            { token } as TokenVerifyRequest
          );
          const response = res.data;
          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else {
            Cookies.remove(TOKEN_COOKIE_KEY);
            setUser(null);
          }
        } catch {
          Cookies.remove(TOKEN_COOKIE_KEY);
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [setUser, setLoading]);

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        setUser,
        updateUser,
        updateAvatar,
        setLoading,
        setError,
        getToken,
        isAuthenticated: state.isAuthenticated,
        handleOAuthCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
