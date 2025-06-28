/**
 * 📁 Data Loader - YAML数据加载器
 *
 * 功能：
 * - 加载和解析YAML格式的论文数据
 * - 数据验证和清理
 * - 生成可视化所需的辅助数据结构
 */

import yaml from "js-yaml";
import { format, parse, isValid } from "date-fns";
import {
  Publication,
  Publications,
  VenueInfo,
  PublicationDataPoint,
  PublicationStats,
  VenueType,
} from "../types/Publication";

/**
 * 🔧 从YAML字符串加载论文数据
 * @param yamlContent YAML格式的字符串内容
 * @returns 解析后的论文数据数组
 */
export const loadPublicationsFromYaml = (yamlContent: string): Publications => {
  try {
    const data = yaml.load(yamlContent) as any;

    // 🎯 支持两种YAML格式：
    // 1. 直接数组格式
    // 2. publications对象格式
    let publicationsArray: any[];

    if (Array.isArray(data)) {
      // 直接数组格式
      publicationsArray = data;
    } else if (data && Array.isArray(data.publications)) {
      // publications对象格式
      publicationsArray = data.publications;
    } else {
      throw new Error("YAML数据必须是数组格式或包含publications字段的对象");
    }

    return publicationsArray.map((item, index) => {
      // 📅 日期格式处理和标准化
      const normalizedDate = normalizeDate(item.date);
      const year =
        item.year ||
        (normalizedDate
          ? new Date(normalizedDate).getFullYear()
          : new Date().getFullYear());

      // 数据验证和规范化
      const publication: Publication = {
        id: item.id || `pub-${String(index + 1).padStart(3, "0")}`,
        title: item.title || "未知标题",
        authors: Array.isArray(item.authors)
          ? item.authors.filter((author: any) => author && author.trim())
          : ["Unknown Author"],
        venue: item.venue || "未知场所",
        venueShort: item.venueShort || item.venue || "Unknown",
        venueType: validateVenueType(item.venueType),
        date: normalizedDate || new Date().toISOString().split("T")[0],
        year,
        tags: Array.isArray(item.tags)
          ? item.tags.filter((tag: any) => tag && tag.trim())
          : [],
        description: item.description || item.abstract || undefined, // 🆕 支持新的description字段
        url: item.url,
        citations:
          typeof item.citations === "number" ? Math.max(0, item.citations) : 0, // 确保引用数为非负数
      };

      return publication;
    });
  } catch (error) {
    console.error("YAML解析失败:", error);
    throw new Error(`YAML数据解析失败: ${error}`);
  }
};

/**
 * 📅 标准化日期格式
 * @param dateStr 原始日期字符串
 * @returns 标准化的日期字符串 (YYYY-MM-DD)
 */
const normalizeDate = (dateStr: string | undefined): string | null => {
  if (!dateStr) return null;

  try {
    // 处理常见的日期格式
    const patterns = [
      /^\d{4}\/\d{1,2}\/\d{1,2}$/, // YYYY/M/D
      /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-M-D
      /^\d{4}\/\d{1,2}$/, // YYYY/M (默认为1号)
      /^\d{4}-\d{1,2}$/, // YYYY-M (默认为1号)
      /^\d{4}$/, // YYYY (默认为1月1号)
    ];

    let normalizedStr = dateStr.trim();

    // 将 / 替换为 -
    normalizedStr = normalizedStr.replace(/\//g, "-");

    // 如果只有年月，添加默认日期
    if (/^\d{4}-\d{1,2}$/.test(normalizedStr)) {
      normalizedStr += "-01";
    }

    // 如果只有年份，添加默认月日
    if (/^\d{4}$/.test(normalizedStr)) {
      normalizedStr += "-01-01";
    }

    // 验证日期有效性
    const date = new Date(normalizedStr);
    if (isValid(date)) {
      return format(date, "yyyy-MM-dd");
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * 🏷️ 验证并标准化场所类型
 * @param venueType 原始场所类型
 * @returns 标准化的场所类型
 */
const validateVenueType = (venueType: any): VenueType => {
  const validTypes: VenueType[] = [
    "journal",
    "conference",
    "workshop",
    "arxiv",
    "other",
  ];

  if (
    typeof venueType === "string" &&
    validTypes.includes(venueType as VenueType)
  ) {
    return venueType as VenueType;
  }

  return "other";
};

/**
 * 🔧 从文件加载YAML数据
 * @param file File对象
 * @returns Promise<Publications>
 */
export const loadPublicationsFromFile = (file: File): Promise<Publications> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const publications = loadPublicationsFromYaml(content);
        resolve(publications);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsText(file);
  });
};

/**
 * 📊 生成统计数据
 * @param publications 论文数据
 * @returns 统计信息对象
 */
export const generateStats = (publications: Publications): PublicationStats => {
  const years = Array.from(new Set(publications.map((p) => p.year))).sort(
    (a, b) => b - a
  );
  const venueTypes = Array.from(
    new Set(publications.map((p) => p.venueType))
  ) as VenueType[];
  const allTags = Array.from(
    new Set(publications.flatMap((p) => p.tags || []))
  );
  const venues = Array.from(new Set(publications.map((p) => p.venueShort)));

  const totalCitations = publications.reduce(
    (sum, p) => sum + (p.citations || 0),
    0
  );
  const avgCitations =
    publications.length > 0 ? totalCitations / publications.length : 0;

  return {
    totalPapers: publications.length,
    years,
    venueTypes,
    allTags: allTags.sort(),
    totalVenues: venues.length,
    yearRange:
      years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : "",
    totalCitations,
    avgCitations: Math.round(avgCitations * 100) / 100,
  };
};

/**
 * 📊 生成场所信息列表
 * @param publications 论文数据
 * @returns 场所信息数组，按论文数量排序
 */
export const generateVenueInfo = (publications: Publications): VenueInfo[] => {
  const venueMap = new Map<string, VenueInfo>();

  // 统计每个场所的信息
  publications.forEach((pub) => {
    const key = pub.venueShort;

    if (venueMap.has(key)) {
      const venueInfo = venueMap.get(key)!;
      venueInfo.count += 1;
    } else {
      venueMap.set(key, {
        name: pub.venue,
        shortName: pub.venueShort,
        type: pub.venueType,
        yPosition: 0, // 稍后设置
        count: 1,
      });
    }
  });

  // 按论文数量排序，数量多的在上方
  const sortedVenues = Array.from(venueMap.values()).sort(
    (a, b) => b.count - a.count
  );

  // 设置Y轴位置
  sortedVenues.forEach((venue, index) => {
    venue.yPosition = sortedVenues.length - index;
  });

  return sortedVenues;
};

/**
 * 🎨 生成可视化数据点
 * @param publications 论文数据
 * @param venues 场所信息
 * @returns 可视化数据点数组
 */
export const generateDataPoints = (
  publications: Publications,
  venues: VenueInfo[]
): PublicationDataPoint[] => {
  const venuePositionMap = new Map(
    venues.map((v) => [v.shortName, v.yPosition])
  );

  const colors = {
    journal: "#2563eb", // 蓝色 - 期刊
    conference: "#dc2626", // 红色 - 会议
    workshop: "#ea580c", // 橙色 - 工作坊
    arxiv: "#16a34a", // 绿色 - ArXiv
    other: "#6b7280", // 灰色 - 其他
  };

  return publications.map((pub) => {
    const timestamp = new Date(pub.date).getTime();
    const yPosition = venuePositionMap.get(pub.venueShort) || 0;

    return {
      publication: pub,
      x: timestamp,
      y: yPosition,
      color: colors[pub.venueType] || colors.other,
      size: Math.max(6, Math.min(20, Math.sqrt(pub.citations || 0) * 2 + 8)), // 🎯 根据引用数的平方根调整大小
    };
  });
};

/**
 * 📈 获取时间范围
 * @param publications 论文数据
 * @returns 时间范围 [最早年份, 最晚年份]
 */
export const getTimeRange = (publications: Publications): [number, number] => {
  if (publications.length === 0) {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear + 1];
  }

  const years = publications.map((pub) => pub.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // 添加一些边距
  return [minYear - 1, maxYear + 1];
};

/**
 * 🎯 获取一作和二作信息
 * @param authors 作者列表
 * @returns 格式化的作者信息
 */
export const getMainAuthors = (
  authors: string[]
): {
  firstAuthor: string;
  secondAuthor?: string;
  displayText: string;
} => {
  const firstAuthor = authors[0] || "未知作者";
  const secondAuthor = authors[1];

  let displayText = firstAuthor;
  if (secondAuthor) {
    displayText += `, ${secondAuthor}`;
  }
  if (authors.length > 2) {
    displayText += ` et al.`;
  }

  return {
    firstAuthor,
    secondAuthor,
    displayText,
  };
};

/**
 * 🔧 截断长文本
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

/**
 * 🎨 获取引用数的可视化颜色
 * @param citations 引用数
 * @returns CSS颜色值
 */
export const getCitationColor = (citations: number): string => {
  if (citations === 0) return "#9ca3af"; // 灰色
  if (citations < 5) return "#22c55e"; // 绿色
  if (citations < 20) return "#f59e0b"; // 黄色
  if (citations < 50) return "#f97316"; // 橙色
  return "#ef4444"; // 红色
};
