/**
 * 📊 Publications View - 论文发表可视化应用
 *
 * 主要功能：
 * - 📋 表格形式展示论文发表情况
 * - 🔍 支持搜索、筛选、排序
 * - 📱 响应式设计
 * - 📊 统计数据展示
 */

import { useState, useEffect } from "react";
import { Publications, PublicationStats } from "./types/Publication";
import { PublicationTable } from "./components/PublicationTable";
import * as dataLoader from "./utils/dataLoader";
import "./App.css";

/**
 * 📊 主应用组件
 */
function App() {
  const [publications, setPublications] = useState<Publications>([]);
  const [stats, setStats] = useState<PublicationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // 🔄 加载论文数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(20);

        console.log("🚀 开始加载论文数据...");

        // 从public目录加载新的YAML数据文件
        const response = await fetch("/data/publications.yaml");
        if (!response.ok) {
          throw new Error(
            `HTTP错误: ${response.status} - ${response.statusText}`
          );
        }

        setLoadingProgress(50);

        const yamlContent = await response.text();
        console.log(
          "📄 YAML文件加载完成，大小:",
          (yamlContent.length / 1024).toFixed(1),
          "KB"
        );

        setLoadingProgress(70);

        const data = dataLoader.loadPublicationsFromYaml(yamlContent);
        const statsData = dataLoader.generateStats(data);

        setPublications(data);
        setStats(statsData);
        setLoadingProgress(100);

        console.log("✅ 论文数据加载成功:", {
          总数: data.length,
          年份范围: statsData.yearRange,
          期刊数量: statsData.totalVenues,
          总引用数: statsData.totalCitations,
          平均引用数: statsData.avgCitations,
          标签数量: statsData.allTags.length,
        });

        // 🎯 按场所类型分组统计
        const venueTypeStats = statsData.venueTypes.reduce((acc, type) => {
          acc[type] = data.filter((p) => p.venueType === type).length;
          return acc;
        }, {} as Record<string, number>);

        console.log("📊 按场所类型统计:", venueTypeStats);
      } catch (err) {
        console.error("❌ 数据加载失败:", err);
        setError(err instanceof Error ? err.message : "数据加载失败");
      } finally {
        setIsLoading(false);
        setLoadingProgress(0);
      }
    };

    loadData();
  }, []);

  // 🔄 加载状态
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <div className="loading-spinner">📊</div>
          <div className="loading-text">Loading Paper Database...</div>
          <div className="loading-progress">
            <div
              className="loading-progress-bar"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="loading-details">
            {loadingProgress <= 20 && "🔗 Connecting to Server..."}
            {loadingProgress > 20 &&
              loadingProgress <= 50 &&
              "📄 Downloading Data File..."}
            {loadingProgress > 50 &&
              loadingProgress <= 70 &&
              "🔧 Parsing YAML Data..."}
            {loadingProgress > 70 && "📊 Generating Statistics..."}
          </div>
        </div>
      </div>
    );
  }

  // ❌ 错误状态
  if (error) {
    return (
      <div className="app-error">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <div className="error-title">Data Loading Failed</div>
          <div className="error-message">{error}</div>
          <div className="error-actions">
            <button
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              🔄 重新加载
            </button>
            <button
              className="debug-button"
              onClick={() => {
                console.log("🐛 Debug Info:", {
                  userAgent: navigator.userAgent,
                  url: window.location.href,
                  timestamp: new Date().toISOString(),
                  error: error,
                });
                alert("Debug Info already printed to console");
              }}
            >
              🐛 Debug Info
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 📊 主界面
  return (
    <div className="app">
      {/* 📊 论文表格 */}
      <PublicationTable publications={publications} stats={stats} />
    </div>
  );
}

export default App;
