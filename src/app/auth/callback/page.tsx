"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get("token");
      const user = searchParams.get("user");

      if (!token) {
        setError("Not receive authentication token");
        return;
      }

      // 检查父窗口是否存在回调处理函数
      if (window.opener && window.opener.handleOAuthCallback) {
        // 直接调用父窗口的处理函数
        window.opener.handleOAuthCallback(token, user);
        window.close(); // 关闭子窗口
      } else {
        // 如果没有父窗口或处理函数，在当前窗口处理
        const result = await handleOAuthCallback(token, user);
        if (result.success) {
          router.push("/");
        } else {
          setError(result.error || "Authentication failed");
        }
      }
    };

    processCallback();
  }, [router, searchParams, handleOAuthCallback]);

  // 显示加载界面或错误信息
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        {error ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Authentication failed
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Back to login
            </button>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Completing authentication...
            </h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
