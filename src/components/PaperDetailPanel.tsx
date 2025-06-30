"use client";

import React from "react";
import { ChevronRight, BookOpen, Save } from "lucide-react";
import { Paper } from "../types.ts/Paper";

interface PaperDetailPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  selectedPaper: Paper | null;
}

/**
 * 右侧论文详细信息面板组件 - 显示选中论文的详细信息
 * @param {PaperDetailPanelProps} props - 组件属性
 * @returns {JSX.Element} PaperDetailPanel组件
 */
export default function PaperDetailPanel({
  isCollapsed,
  onToggle,
  selectedPaper,
}: PaperDetailPanelProps) {
  return (
    <div
      className={`relative bg-white border-l border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-0" : "w-96"
      }`}
    >
      {/* 收缩按钮 */}
      <button
        onClick={onToggle}
        className="absolute -left-3 top-20 z-10 bg-white border border-gray-300 rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow"
      >
        <ChevronRight
          className={`h-4 w-4 text-gray-600 transition-transform ${
            isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 面板内容 */}
      <div className={`h-full overflow-hidden ${isCollapsed ? "w-0" : "w-96"}`}>
        <div className="h-full overflow-y-auto scrollbar-thin">
          {selectedPaper ? (
            <div className="p-4">
              {/* 论文标题和保存按钮 */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold text-gray-900 leading-tight pr-4">
                  {selectedPaper.title}
                </h2>
                <button className="flex items-center text-sm text-gray-500">
                  <Save size={16} className="mr-1" />
                  <span>Save</span>
                </button>
              </div>

              {/* 作者信息 */}
              <div className="mb-3">
                <div className="text-sm text-gray-600">
                  {selectedPaper.authors.map((author, index) => (
                    <span key={index}>
                      {author}
                      {index < selectedPaper.authors.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              </div>

              {/* 发表信息 */}
              <div className="text-sm text-gray-500 mb-4">
                <span>
                  {selectedPaper.year}, {selectedPaper.publisher || "arXiv.org"}
                </span>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                {selectedPaper.citations} Citations
              </div>

              {/* Open in */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Open in:
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex items-center justify-center p-2 border border-gray-200 rounded-md">
                    <img src="/file.svg" alt="File" className="w-5 h-5" />
                  </button>
                  <button className="flex items-center justify-center p-2 border border-gray-200 rounded-md">
                    <img src="/globe.svg" alt="Web" className="w-5 h-5" />
                  </button>
                  <button className="flex items-center justify-center p-2 border border-gray-200 rounded-md">
                    <img src="/window.svg" alt="Window" className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 摘要 */}
              {selectedPaper.abstract && (
                <div className="mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedPaper.abstract}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">选择一篇论文查看详细信息</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
