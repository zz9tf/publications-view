"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/Header";
import PaperSidebar from "@/components/PaperSidebar";
import PaperDetailPanel from "@/components/PaperDetailPanel";
import { Paper } from "@/types";
import { useUrlItem } from "@/contexts/UrlItemContext";

/**
 * 主页面组件 - Paper View应用的主界面
 * @returns {JSX.Element} Home组件
 */
export default function Home() {
  // 状态管理 🎯
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  // 获取动态数据 📡
  const { urlItems } = useUrlItem();

  // 从urlItems中提取所有papers 📚
  const papers: Paper[] = useMemo(() => {
    const allPapers: Paper[] = [];

    urlItems.forEach((item) => {
      if (item.papers && item.papers.length > 0) {
        allPapers.push(...item.papers);
      }
    });

    return allPapers;
  }, [urlItems]);

  /**
   * 处理论文选择 📖
   * @param {Paper} paper - 选中的论文
   */
  const handleSelectPaper = (paper: Paper) => {
    setSelectedPaper(paper);
    // 如果右侧面板被收缩了，自动展开
    if (rightPanelCollapsed) {
      setRightPanelCollapsed(false);
    }
  };

  /**
   * 切换左侧边栏状态 ⬅️
   */
  const toggleLeftSidebar = () => {
    setLeftSidebarCollapsed(!leftSidebarCollapsed);
  };

  /**
   * 切换右侧面板状态 ➡️
   */
  const toggleRightPanel = () => {
    setRightPanelCollapsed(!rightPanelCollapsed);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <Header />

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 - 论文列表 */}
        <PaperSidebar
          isCollapsed={leftSidebarCollapsed}
          onToggle={toggleLeftSidebar}
          papers={papers}
          selectedPaper={selectedPaper}
          onSelectPaper={handleSelectPaper}
        />

        {/* 中间内容区域 */}
        <div className="flex-1 bg-white flex items-center justify-center">
          {papers.length === 0 ? (
            <div className="text-center text-gray-500">
              <div className="text-lg mb-2">📚 No papers loaded yet</div>
              <div className="text-sm">
                Add a Google Scholar URL to get started
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-lg mb-2">
                📖 {papers.length} papers loaded
              </div>
              <div className="text-sm">
                Select a paper from the left sidebar to view details
              </div>
            </div>
          )}
        </div>

        {/* 右侧详情面板 */}
        <PaperDetailPanel
          isCollapsed={rightPanelCollapsed}
          onToggle={toggleRightPanel}
          selectedPaper={selectedPaper}
        />
      </div>
    </div>
  );
}
