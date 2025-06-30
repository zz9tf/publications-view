"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import PaperSidebar from "@/components/PaperSidebar";
import PaperDetailPanel from "@/components/PaperDetailPanel";
import { Paper } from "@/types";

/**
 * 主页面组件 - Paper View应用的主界面
 * @returns {JSX.Element} Home组件
 */
export default function Home() {
  // 状态管理 🎯
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  // 模拟论文数据 📚
  const mockPapers: Paper[] = [
    {
      id: "1",
      title:
        "CODI: Compressing Chain-of-Thought into Continuous Space via Self-Distillation",
      authors: [
        "Zhenyi Shen",
        "Heng Yan",
        "Linhai Zhang",
        "Zhanghao Hu",
        "Yali Du",
      ],
      year: 2025,
      citations: 4,
      type: "Origin paper",
      abstract:
        "Chain-of-Thought (CoT) enhances Large Language Models (LLMs) by enabling step-by-step reasoning in natural language. However, the language space may be suboptimal for reasoning. While implicit CoT methods attempt to enable reasoning without explicit CoT tokens, they have consistently lagged behind explicit CoT method in task performance. We propose CODI (Continuous Chain-of-Thought via Self-Distillation), a novel framework that distills CoT into a continuous space, where a shared model acts as both teacher and student, jointly learning explicit and implicit CoT while aligning their hidden activation on the token generating the final answer. CODI is the first implicit CoT method to match explicit CoT's performance on GSM8k while achieving 3.1x compression, surpassing the previous state-of-the-art by 28.2% in accuracy. Furthermore, CODI demonstrates scalability, robustness, and generalizability to more complex CoT datasets. Additionally, CODI retains interpretability by decoding its continuous thoughts, making its reasoning process transparent. Our findings establish implicit CoT as not only a more efficient but a powerful alternative to explicit CoT.",
      arxivId: "arXiv.org",
      publisher: "arXiv.org",
      keywords: [
        "Chain-of-Thought",
        "Large Language Models",
        "Self-Distillation",
        "Reasoning",
      ],
    },
    {
      id: "2",
      title:
        "Distilling Reasoning Ability from Large Language Models with Adaptive Thinking",
      authors: ["Xiao Chen", "Sihang Zhou", "K. Liang", "Xinwang Liu"],
      year: 2024,
      citations: 12,
      type: "Original paper",
      abstract:
        "This paper presents a novel approach to distill reasoning capabilities from large language models through adaptive thinking mechanisms.",
      keywords: ["Reasoning", "Distillation", "Adaptive Thinking"],
    },
    {
      id: "3",
      title: "SoftCoT: Soft Chain-of-Thought for Efficient Reasoning with LLMs",
      authors: ["Yige Xu", "Xu Guo", "Zhiwei Zeng", "Chunyan Miao"],
      year: 2025,
      citations: 8,
      type: "Original paper",
      abstract:
        "We introduce SoftCoT, a method for efficient reasoning in large language models using soft chain-of-thought approaches.",
      keywords: ["Chain-of-Thought", "Efficiency", "LLMs"],
    },
    {
      id: "4",
      title: "TokenSkip: Controllable Chain-of-Thought Compression in LLMs",
      authors: [
        "Henming Xia",
        "Yongqi Li",
        "Chak Tou Leong",
        "Wenjie Wang",
        "Wenjie Li",
      ],
      year: 2025,
      citations: 5,
      type: "Conference paper",
      abstract:
        "TokenSkip presents a controllable approach to compress chain-of-thought reasoning in large language models.",
      keywords: ["Token Compression", "Chain-of-Thought", "Control"],
    },
    {
      id: "5",
      title:
        "Democratizing Reasoning Ability: Tailored Learning from Large Language Model",
      authors: ["Zhaoyang Wang", "Shaohan Huang", "Yuzuan Liu", "Jiahai Wang"],
      year: 2023,
      citations: 15,
      type: "Journal paper",
      abstract:
        "This work focuses on democratizing reasoning abilities through tailored learning approaches.",
      keywords: ["Democratization", "Reasoning", "Tailored Learning"],
    },
  ];

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
          papers={mockPapers}
          selectedPaper={selectedPaper}
          onSelectPaper={handleSelectPaper}
        />

        {/* 中间内容区域 - 保持空白 */}
        <div className="flex-1 bg-white">
          {/* 这里留空，用于后续功能开发 */}
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
