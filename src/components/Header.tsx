"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import AddPaperModal from "./AddPaperModal";
import { useAuth } from "../contexts/AuthContext";
import { API_PATHS, SOCIAL_PROVIDERS_CLIENT_ID } from "@/types";

interface WindowWithCallbacks extends Window {
  handleOAuthCallback?: (token: string, user: string | null) => void;
}

export default function Header() {
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const { handleOAuthCallback, logout, state } = useAuth();
  const { user } = state;
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleGoogleLogin = async () => {
    // 使用类型断言为WindowWithCallbacks
    (window as WindowWithCallbacks).handleOAuthCallback = async (
      token: string,
      user: string | null
    ) => {
      try {
        // 直接在父窗口处理OAuth回调
        const result = await handleOAuthCallback(token, user);
        if (result.success) {
          router.push("/");
        } else {
          console.error("Authentication failed:", result.error);
        }
      } catch (error) {
        console.error("Error processing OAuth callback:", error);
      }
    };

    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    // 构建后端API的完整URL作为重定向URI
    const backendUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:8000/api"
        : process.env.NEXT_PUBLIC_API_URL;

    const redirectUri = `${backendUrl}${API_PATHS.SOCIAL_LOGIN.GOOGLE}`;

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/auth?client_id=${SOCIAL_PROVIDERS_CLIENT_ID.GOOGLE}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent("email profile")}` +
      `&prompt=select_account`;

    window.open(
      googleAuthUrl,
      "GoogleLogin",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  // 处理用户菜单点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 清理全局函数
  useEffect(() => {
    return () => {
      delete (window as WindowWithCallbacks).handleOAuthCallback;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 h-16 px-12 bg-white shadow-md z-10 relative">
        <div className="flex-shrink-0">
          <h1 className="text-xl font-semibold text-gray-900">Paper View</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 transition-colors focus:outline-none"
            onClick={() => setIsAddPaperOpen(true)}
          >
            <Search size={16} />
            <span>Add Google Scholar or Search Result</span>
          </button>
          <button className="flex items-center bg-white border-gray-300 rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none">
            Pricing
          </button>

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center gap-1 focus:outline-none"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {(user.username?.charAt(0) || "U").toUpperCase()}
                    </div>
                  )}
                </div>
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="flex items-center bg-white border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none"
              onClick={handleGoogleLogin}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <AddPaperModal
        isOpen={isAddPaperOpen}
        onClose={() => setIsAddPaperOpen(false)}
      />
    </>
  );
}
