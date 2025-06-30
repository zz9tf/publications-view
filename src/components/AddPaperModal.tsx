"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useUrlItem } from "@/contexts/UrlItemContext";

interface AddPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 添加论文链接的弹出模态框组件
 * @param {AddPaperModalProps} props - 组件属性
 * @returns {JSX.Element | null} AddPaperModal组件
 */
export default function AddPaperModal({ isOpen, onClose }: AddPaperModalProps) {
  const [url, setUrl] = useState<string>("");
  const { fetchUrlItem, urlItems, removeUrlItem } = useUrlItem();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 使用WebSocket上下文
  const { isConnected, clientId } = useWebSocket();

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // 自动聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // ESC键关闭
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // 处理URL提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim() || isSubmitting || !isConnected || !clientId) {
      if (!isConnected) {
        alert("WebSocket is not connected, please try again later");
      }
      return;
    }

    // 检查URL是否有效
    if (!url.toLowerCase().includes("scholar.google.com")) {
      alert("Please enter a valid Google Scholar URL");
      return;
    }

    setIsSubmitting(true);

    try {
      const searchId = `search-${Date.now()}`;
      await fetchUrlItem(url, searchId);
      // 清空输入框
      setUrl("");
    } catch (error) {
      console.error("Submit failed:", error);
      alert("Submit failed, please try again later");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-[15vh]">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
      >
        {/* 搜索输入框 */}
        <form
          onSubmit={handleSubmit}
          className="p-4 flex items-center border-b border-gray-100"
        >
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Add google scholar URL"
            className="flex-1 border-0 outline-none text-gray-800 placeholder-gray-400 text-base focus:ring-0 focus:outline-none"
            style={{ boxShadow: "none" }}
            disabled={isSubmitting || !isConnected}
          />
          <div className="text-xs text-gray-400 px-2 ml-2">esc</div>
        </form>

        {/* WebSocket连接状态 */}
        {!isConnected && (
          <div className="px-4 py-2 bg-yellow-50 text-yellow-700 text-xs">
            Connecting to server, please wait...
          </div>
        )}

        {/* 已添加的学者列表 */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Added Google Scholar
          </h3>
          {urlItems.length === 0 ? (
            <div className="text-sm text-gray-500 py-2">
              No Google Scholar links added
            </div>
          ) : (
            <div className="space-y-2">
              {urlItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md group"
                >
                  <div className="flex flex-col flex-grow mr-4">
                    <div className="flex items-center justify-between my-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">
                          {item.shortDescription}
                        </span>
                        {/* 进度条 */}
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className={`h-2 rounded-full ${
                                item.status === "error"
                                  ? "bg-red-500"
                                  : "bg-green-400"
                              }`}
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {item.progress}%
                          </span>
                        </div>
                        {item.status === "completed" &&
                          item.fetchedPaperCount !== undefined &&
                          item.totalPaperCount !== undefined && (
                            <span className="text-xs text-gray-500">
                              Fetched {item.fetchedPaperCount}/
                              {item.totalPaperCount} papers
                            </span>
                          )}
                        {item.status === "error" && (
                          <span className="text-xs text-red-500">
                            {item.status || "Error"}
                          </span>
                        )}
                      </div>
                      <button
                        className="ml-2 text-gray-400 transition-opacity"
                        onClick={() => removeUrlItem(item.searchId)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex items-center mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部搜索提供者 */}
        <div className="p-4 border-t border-gray-100 flex justify-end items-center">
          <span className="text-xs text-gray-400 mr-2">Provided by</span>
          <span className="text-gray-500 font-medium text-sm">Paper View</span>
        </div>
      </div>
    </div>
  );
}
