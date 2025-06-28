/**
 * 📚 Publication Types - 论文数据类型定义
 *
 * 设计理念：
 * - 简洁易用：减少不必要的嵌套层级
 * - 约定优于配置：authors列表默认前两个为一作和二作
 * - 高效解析：支持YAML格式的直接映射
 */

/**
 * 论文发表场所类型
 */
export type VenueType =
  | "journal"
  | "conference"
  | "workshop"
  | "arxiv"
  | "other";

/**
 * 论文数据接口
 */
export interface Publication {
  /** 唯一标识符 */
  id: string;

  /** 论文标题 */
  title: string;

  /**
   * 作者列表
   * 约定：第一个为一作，第二个为二作
   */
  authors: string[];

  /** 发表场所名称 */
  venue: string;

  /** 发表场所缩写 */
  venueShort: string;

  /** 发表场所类型 */
  venueType: VenueType;

  /** 发表日期 (YYYY/M/D 或 YYYY-MM-DD 格式) */
  date: string;

  /** 发表年份 (用于快速索引) */
  year: number;

  /** 标签列表 (可选) */
  tags?: string[];

  /** 📝 论文详细描述/摘要 (新字段，替代原abstract) */
  description?: string;

  /** 论文链接 (可选) */
  url?: string;

  /** 🔥 引用数 (可选，用于视觉编码) */
  citations?: number;
}

/**
 * 论文集合接口
 * 直接使用数组，无需额外嵌套
 */
export type Publications = Publication[];

/**
 * 🎯 筛选选项接口
 */
export interface FilterOptions {
  /** 选中的年份 */
  selectedYear?: number;

  /** 选中的场所类型 */
  selectedVenueType?: VenueType | "all";

  /** 搜索关键词 */
  searchTerm?: string;

  /** 最小引用数 */
  minCitations?: number;

  /** 选中的标签 */
  selectedTags?: string[];
}

/**
 * 📊 排序选项接口
 */
export interface SortOptions {
  /** 排序字段 */
  field: "date" | "venue" | "title" | "authors" | "citations";

  /** 排序方向 */
  order: "asc" | "desc";
}

/**
 * 可视化数据点接口
 * 用于图表渲染的数据结构
 */
export interface PublicationDataPoint {
  /** 对应的论文数据 */
  publication: Publication;

  /** X轴坐标 (时间戳) */
  x: number;

  /** Y轴坐标 (场所索引) */
  y: number;

  /** 点的颜色 */
  color: string;

  /** 点的大小 */
  size: number;
}

/**
 * 场所信息接口
 * 用于Y轴标签和分组
 */
export interface VenueInfo {
  /** 场所名称 */
  name: string;

  /** 场所缩写 */
  shortName: string;

  /** 场所类型 */
  type: VenueType;

  /** Y轴位置 */
  yPosition: number;

  /** 该场所的论文数量 */
  count: number;
}

/**
 * 📈 统计数据接口
 */
export interface PublicationStats {
  /** 论文总数 */
  totalPapers: number;

  /** 所有年份列表 */
  years: number[];

  /** 所有场所类型 */
  venueTypes: VenueType[];

  /** 所有标签 */
  allTags: string[];

  /** 场所总数 */
  totalVenues: number;

  /** 年份范围 */
  yearRange: string;

  /** 总引用数 */
  totalCitations: number;

  /** 平均引用数 */
  avgCitations: number;
}
