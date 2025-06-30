// API请求响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 用户相关类型
export interface User {
  user_id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

// 认证相关请求类型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface TokenVerifyRequest {
  token: string;
}

export interface TokenVerifyResponse {
  user: User;
}

// 认证状态类型
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginError: string | null;
  registerError: string | null;
  token: string | null;
}

export interface UpdateAvatarRequest {
  token: string;
  avatar: string; // Base64 编码的图片数据
}

// WebSocket相关类型
export type EventData = Record<string, unknown>;

export interface WebSocketMessage {
  event: string;
  data: EventData;
}

// API路径常量
export const API_PATHS = {
  // 用户认证
  LOGIN: "/user/login",
  REGISTER: "/user/register",
  LOGOUT: "/user/logout",
  VERIFY_TOKEN: "/user/verify-token",
  UPDATE_AVATAR: "/user/avatar",
  SOCIAL_LOGIN: {
    GOOGLE: "/user/social-login/google",
  },
  // URL条目
  FETCH_URL_ITEM: "/url-item/fetch",
};

export const SOCIAL_PROVIDERS_CLIENT_ID = {
  GOOGLE: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
};

// WebSocket事件常量
export const WS_EVENTS = {
  CLIENT_CONNECTED: "client_connected",
  UPDATE_URL_ITEM_FETCHING_PROCESS: "update_url_item_fetching_process",
};

export interface GoogleSearchRequest {
  url: string;
  searchId: string;
  clientId: string;
}

export interface URLItem {
  searchId: string;
  url: string;
  shortDescription: string;
  progress: number;
  status: "completed" | "processing" | "error";
  fetchedPaperCount: number;
  totalPaperCount: number;
}
// 论文相关类型

export interface Paper {
  id?: string;
  title: string;
  year: number;
  authors: string[];
  date: string;
  citations: number;
  paper_type: string;
  publisher?: string;
  description?: string;
  link?: string;
}
