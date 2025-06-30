"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { Paper } from "@/types";

interface PaperSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  papers: Paper[];
  selectedPaper: Paper | null;
  onSelectPaper: (paper: Paper) => void;
}

/**
 * 左侧论文列表侧边栏组件 - 显示论文列表和筛选选项
 * @param {PaperSidebarProps} props - 组件属性
 * @returns {JSX.Element} PaperSidebar组件
 */
export default function PaperSidebar({
  isCollapsed,
  onToggle,
  papers,
  selectedPaper,
  onSelectPaper,
}: PaperSidebarProps) {
  return (
    <div
      className={`relative bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-0" : "w-80"
      }`}
    >
      {/* 收缩按钮 */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-10 bg-white border border-gray-300 rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow"
      >
        <ChevronLeft
          className={`h-4 w-4 text-gray-600 transition-transform ${
            isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 侧边栏内容 */}
      <div className={`h-full overflow-hidden ${isCollapsed ? "w-0" : "w-80"}`}>
        <div className="p-4">
          {/* 筛选控制 */}
          <div className="mb-4 flex justify-center items-center gap-3 border-b border-gray-200 pb-2">
            <button className="px-3 py-1.5 w-14 text-sm text-center border-b-2 border-gray-800 font-medium focus:outline-none">
              Paper
            </button>
            <button className="px-3 py-1.5 w-14 text-sm text-center text-gray-500 focus:outline-none">
              Author
            </button>
            <button className="px-3 py-1.5 w-28 text-sm text-center text-gray-500 focus:outline-none">
              Publisher
            </button>
          </div>

          {/* 论文列表 */}
          <div
            className="space-y-3 overflow-y-auto scrollbar-thin"
            style={{ maxHeight: "calc(100vh - 150px)" }}
          >
            {papers.map((paper) => (
              <div
                key={paper.title}
                onClick={() => onSelectPaper(paper)}
                className={`p-3 cursor-pointer transition-colors rounded-lg ${
                  selectedPaper?.title === paper.title
                    ? "bg-blue-50"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start">
                    <span className="text-xs text-gray-600 font-medium">
                      {paper.paper_type}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                    {paper.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {paper.authors.join(", ")}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-500">{paper.year}</span>
                    <span className="text-xs text-gray-500">
                      {paper.citations} Citations
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
