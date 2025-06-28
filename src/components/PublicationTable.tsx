/**
 * 📊 Publications Table - 论文发表表格视图
 *
 * 功能特性：
 * - 📋 表格形式展示论文列表
 * - 🔍 支持按年份、期刊类型、标签筛选
 * - 📊 支持排序（按时间、期刊、标题、引用数）
 * - 🎨 响应式设计，支持移动端
 * - 🔗 点击查看详情
 * - 💡 引用数可视化显示
 * - 📝 论文描述预览
 */

import React, { useState, useMemo } from "react";
import {
  Publications,
  PublicationStats,
  Publication,
  VenueType,
} from "../types/Publication";
import * as dataLoader from "../utils/dataLoader";
import "./PublicationTable.css";

interface PublicationTableProps {
  /** 论文数据 */
  publications: Publications;
  /** 统计数据 */
  stats: PublicationStats | null;
}

/** 排序选项 */
type SortField = "date" | "venue" | "title" | "authors" | "citations";
type SortOrder = "asc" | "desc";

/**
 * 📊 论文表格组件
 */
export const PublicationTable: React.FC<PublicationTableProps> = ({
  publications,
  stats,
}) => {
  // 🎯 状态管理
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedVenueType, setSelectedVenueType] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [minCitations, setMinCitations] = useState<number>(0);
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [showDescriptions, setShowDescriptions] = useState(false);

  // 🔍 筛选和排序数据
  const filteredAndSortedPapers = useMemo(() => {
    let filtered = [...publications];

    // 按年份筛选
    if (selectedYear) {
      filtered = filtered.filter((p) => p.year === selectedYear);
    }

    // 按期刊类型筛选
    if (selectedVenueType !== "all") {
      filtered = filtered.filter((p) => p.venueType === selectedVenueType);
    }

    // 按标签筛选
    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        (p) => p.tags && selectedTags.some((tag) => p.tags!.includes(tag))
      );
    }

    // 按最小引用数筛选
    if (minCitations > 0) {
      filtered = filtered.filter((p) => (p.citations || 0) >= minCitations);
    }

    // 按搜索词筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.authors.some((author) => author.toLowerCase().includes(term)) ||
          p.venue.toLowerCase().includes(term) ||
          p.venueShort.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term)) ||
          (p.tags && p.tags.some((tag) => tag.toLowerCase().includes(term)))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "date":
          compareValue =
            new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "venue":
          compareValue = a.venueShort.localeCompare(b.venueShort);
          break;
        case "title":
          compareValue = a.title.localeCompare(b.title);
          break;
        case "authors":
          compareValue = a.authors[0]?.localeCompare(b.authors[0] || "") || 0;
          break;
        case "citations":
          compareValue = (a.citations || 0) - (b.citations || 0);
          break;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [
    publications,
    selectedYear,
    selectedVenueType,
    selectedTags,
    minCitations,
    searchTerm,
    sortField,
    sortOrder,
  ]);

  // 🎨 获取期刊类型颜色
  const getVenueTypeColor = (venueType: VenueType): string => {
    const colors = {
      journal: "#3182ce",
      conference: "#e53e3e",
      workshop: "#dd6b20",
      arxiv: "#38a169",
      other: "#718096",
    };
    return colors[venueType] || colors.other;
  };

  // 🎨 获取期刊类型图标
  const getVenueTypeIcon = (venueType: VenueType): string => {
    const icons = {
      journal: "📚",
      conference: "🎤",
      workshop: "🔧",
      arxiv: "📄",
      other: "📋",
    };
    return icons[venueType] || icons.other;
  };

  // 📋 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "citations" ? "desc" : "asc"); // 引用数默认降序
    }
  };

  // 🔄 获取排序图标
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return "↕️";
    return sortOrder === "asc" ? "⬆️" : "⬇️";
  };

  // 🏷️ 处理标签选择
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 📝 渲染论文描述
  const renderDescription = (publication: Publication) => {
    if (!publication.description) return null;

    const truncated = dataLoader.truncateText(publication.description, 200);
    return (
      <div className="paper-description">
        <p>{truncated}</p>
        {publication.description.length > 200 && (
          <button
            className="read-more-btn"
            onClick={() => setSelectedPaper(publication.id)}
          >
            阅读更多...
          </button>
        )}
      </div>
    );
  };

  // 🏷️ 渲染标签
  const renderTags = (tags: string[] | undefined) => {
    if (!tags || tags.length === 0) return null;

    return (
      <div className="paper-tags">
        {tags.map((tag, index) => (
          <span
            key={index}
            className={`tag ${
              selectedTags.includes(tag) ? "tag-selected" : ""
            }`}
            onClick={() => handleTagToggle(tag)}
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // 🔥 渲染引用数
  const renderCitations = (citations: number) => {
    const color = dataLoader.getCitationColor(citations);
    return (
      <span
        className="citation-count"
        style={{ color }}
        title={`${citations} 次引用`}
      >
        🔥 {citations}
      </span>
    );
  };

  return (
    <div className="publications-table">
      {/* 📊 头部信息 */}
      <div className="table-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="table-title">📊 论文发表数据库</h1>
            <div className="table-stats">
              显示 <strong>{filteredAndSortedPapers.length}</strong> /{" "}
              {stats?.totalPapers || publications.length} 篇论文
              {selectedYear && ` · ${selectedYear}年`}
              {selectedVenueType !== "all" && ` · ${selectedVenueType}`}
              {selectedTags.length > 0 && ` · ${selectedTags.join(", ")}`}
              {minCitations > 0 && ` · 引用≥${minCitations}`}
              {/* 📈 小标签统计信息 */}
              {stats && (
                <div className="stats-tags">
                  <span className="stat-tag">
                    🏛️ {stats.totalVenues} 个期刊/会议
                  </span>
                  <span className="stat-tag">📅 {stats.yearRange}</span>
                  <span className="stat-tag">
                    🔥 {stats.totalCitations} 次引用
                  </span>
                  <span className="stat-tag">
                    🏷️ {stats.allTags.length} 个标签
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="header-right">
            <button
              className={`toggle-btn ${showDescriptions ? "active" : ""}`}
              onClick={() => setShowDescriptions(!showDescriptions)}
              title="显示/隐藏论文描述"
            >
              📝 {showDescriptions ? "隐藏" : "显示"}描述
            </button>
          </div>
        </div>
      </div>

      {/* 🔍 筛选控制栏 */}
      <div className="filter-controls">
        <div className="controls-row">
          {/* 搜索框 */}
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 搜索论文标题、作者、期刊、描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* 年份筛选 */}
          <select
            value={selectedYear || ""}
            onChange={(e) =>
              setSelectedYear(e.target.value ? Number(e.target.value) : null)
            }
            className="filter-select"
          >
            <option value="">全部年份</option>
            {stats?.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* 期刊类型筛选 */}
          <select
            value={selectedVenueType}
            onChange={(e) => setSelectedVenueType(e.target.value)}
            className="filter-select"
          >
            <option value="all">全部类型</option>
            <option value="journal">📚 期刊</option>
            <option value="conference">🎤 会议</option>
            <option value="workshop">🔧 工作坊</option>
            <option value="arxiv">📄 ArXiv</option>
            <option value="other">📋 其他</option>
          </select>

          {/* 最小引用数筛选 */}
          <div className="citation-filter">
            <label htmlFor="min-citations">最小引用数:</label>
            <input
              id="min-citations"
              type="number"
              min="0"
              value={minCitations}
              onChange={(e) => setMinCitations(Number(e.target.value) || 0)}
              className="citation-input"
            />
          </div>
        </div>

        {/* 标签筛选 */}
        {stats?.allTags && stats.allTags.length > 0 && (
          <div className="tags-filter">
            <label>🏷️ 标签筛选:</label>
            <div className="tags-grid">
              {stats.allTags.slice(0, 20).map((tag) => (
                <button
                  key={tag}
                  className={`tag-filter ${
                    selectedTags.includes(tag) ? "selected" : ""
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
              {stats.allTags.length > 20 && (
                <span className="more-tags">
                  +{stats.allTags.length - 20} 更多...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 📊 论文表格 */}
      <div className="table-container">
        <table className="publications-table-main">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("title")}>
                论文标题 {getSortIcon("title")}
              </th>
              <th className="sortable" onClick={() => handleSort("authors")}>
                作者 {getSortIcon("authors")}
              </th>
              <th className="sortable" onClick={() => handleSort("venue")}>
                发表场所 {getSortIcon("venue")}
              </th>
              <th className="sortable" onClick={() => handleSort("date")}>
                日期 {getSortIcon("date")}
              </th>
              <th className="sortable" onClick={() => handleSort("citations")}>
                引用 {getSortIcon("citations")}
              </th>
              <th>标签</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPapers.map((pub) => (
              <React.Fragment key={pub.id}>
                <tr
                  className={`publication-row ${
                    selectedPaper === pub.id ? "selected" : ""
                  }`}
                  onClick={() =>
                    setSelectedPaper(selectedPaper === pub.id ? null : pub.id)
                  }
                >
                  <td className="title-cell">
                    <div className="title-wrapper">
                      <h3 className="paper-title">{pub.title}</h3>
                      {showDescriptions && renderDescription(pub)}
                    </div>
                  </td>
                  <td className="authors-cell">
                    <div className="authors-list">
                      {dataLoader.getMainAuthors(pub.authors).displayText}
                    </div>
                  </td>
                  <td className="venue-cell">
                    <div className="venue-info">
                      <span
                        className="venue-type-icon"
                        style={{ color: getVenueTypeColor(pub.venueType) }}
                      >
                        {getVenueTypeIcon(pub.venueType)}
                      </span>
                      <div className="venue-names">
                        <span className="venue-short">{pub.venueShort}</span>
                        <span className="venue-full">{pub.venue}</span>
                      </div>
                    </div>
                  </td>
                  <td className="date-cell">
                    <div className="date-info">
                      <span className="year">{pub.year}</span>
                      <span className="date">{pub.date}</span>
                    </div>
                  </td>
                  <td className="citations-cell">
                    {renderCitations(pub.citations || 0)}
                  </td>
                  <td className="tags-cell">{renderTags(pub.tags)}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* 空状态 */}
        {filteredAndSortedPapers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">没有找到匹配的论文</div>
            <div className="empty-message">请尝试调整筛选条件或搜索关键词</div>
            <button
              className="clear-filters-btn"
              onClick={() => {
                setSelectedYear(null);
                setSelectedVenueType("all");
                setSelectedTags([]);
                setSearchTerm("");
                setMinCitations(0);
              }}
            >
              🔄 清除所有筛选
            </button>
          </div>
        )}
      </div>

      {/* 📝 论文详情弹窗 */}
      {selectedPaper && (
        <div
          className="paper-modal-overlay"
          onClick={() => setSelectedPaper(null)}
        >
          <div className="paper-modal" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const paper = publications.find((p) => p.id === selectedPaper);
              if (!paper) return null;

              return (
                <>
                  <div className="modal-header">
                    <h2>{paper.title}</h2>
                    <button
                      className="close-btn"
                      onClick={() => setSelectedPaper(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="modal-content">
                    <div className="paper-meta">
                      <p>
                        <strong>作者:</strong> {paper.authors.join(", ")}
                      </p>
                      <p>
                        <strong>发表场所:</strong> {paper.venue} (
                        {paper.venueShort})
                      </p>
                      <p>
                        <strong>发表日期:</strong> {paper.date}
                      </p>
                      <p>
                        <strong>引用数:</strong> {paper.citations || 0}
                      </p>
                      {paper.tags && paper.tags.length > 0 && (
                        <p>
                          <strong>标签:</strong> {paper.tags.join(", ")}
                        </p>
                      )}
                    </div>
                    {paper.description && (
                      <div className="paper-description-full">
                        <h3>📝 论文描述</h3>
                        <div className="description-content">
                          {paper.description}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
