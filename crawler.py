from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import yaml
import re
from datetime import datetime

class GoogleScholarCrawler:
    """
    🔍 Google Scholar 论文爬虫
    功能：从Google Scholar页面抓取论文详细信息并保存为YAML格式
    """
    
    def __init__(self, headless=False):
        """
        初始化爬虫配置
        
        Args:
            headless (bool): 是否使用无头浏览器模式
        """
        self.options = Options()
        if headless:
            self.options.add_argument("--headless")
        self.options.add_argument("--disable-gpu")
        self.options.add_argument("--window-size=1200,800")
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")
        
        self.driver = webdriver.Chrome(options=self.options)
        self.wait = WebDriverWait(self.driver, 10)
        self.publications = []
        
    def get_all_papers(self, url):
        """
        📚 获取所有论文基本信息（标题和链接）
        
        Args:
            url (str): Google Scholar个人主页URL
            
        Returns:
            list: 包含论文标题和链接的列表
        """
        print("🚀 开始访问Google Scholar页面...")
        self.driver.get(url)
        
        # 自动点击"Show more"直到没有更多可点 📋
        print("📋 正在加载所有论文...")
        while True:
            try:
                more_button = self.driver.find_element(By.ID, "gsc_bpf_more")
                if more_button.is_enabled():
                    more_button.click()
                    time.sleep(2)  # 增加等待时间
                    print("  ⏳ 加载更多论文...")
                else:
                    break
            except NoSuchElementException:
                print("  ✅ 所有论文已加载完成")
                break
            except Exception as e:
                print(f"  ⚠️ 加载过程中出现异常: {e}")
                break
        
        # 获取所有论文链接和基础信息 🔗
        paper_rows = self.driver.find_elements(By.CSS_SELECTOR, ".gsc_a_tr")
        papers = []
        
        for i, row in enumerate(paper_rows):
            try:
                # 提取标题和链接
                title_elem = row.find_element(By.CSS_SELECTOR, ".gsc_a_t a")
                title = title_elem.text.strip()
                link = title_elem.get_attribute("href")
                
                if not title or not link:
                    continue
                
                paper_info = {"title": title, "link": link}
                
                # 尝试从主页面提取引用次数 📈
                try:
                    citation_elem = row.find_element(By.CSS_SELECTOR, ".gsc_a_c")
                    citation_text = citation_elem.text.strip()
                    if citation_text and citation_text.isdigit():
                        paper_info["citations_preview"] = int(citation_text)
                        print(f"    📈 预览引用次数 '{title[:30]}...': {citation_text}")
                except:
                    paper_info["citations_preview"] = 0
                
                # 尝试提取年份信息 📅
                try:
                    year_elem = row.find_element(By.CSS_SELECTOR, ".gsc_a_y")
                    year_text = year_elem.text.strip()
                    if year_text and year_text.isdigit():
                        paper_info["year_preview"] = int(year_text)
                        print(f"    📅 预览年份 '{title[:30]}...': {year_text}")
                except:
                    paper_info["year_preview"] = None
                
                papers.append(paper_info)
                
            except Exception as e:
                print(f"⚠️ 提取第{i+1}行论文信息时出错: {e}")
                continue
        
        print(f"📊 总共找到 {len(papers)} 篇论文")
        return papers
    
    def extract_paper_details(self, paper_info):
        """
        🔍 从论文详情页面提取详细信息
        
        Args:
            paper_info (dict): 包含论文基本信息的字典，包括link和预览信息
            
        Returns:
            dict: 包含论文详细信息的字典
        """
        try:
            paper_link = paper_info.get("link")
            print(f"  🔍 正在提取论文详情...")
            self.driver.get(paper_link)
            time.sleep(2)
            
            details = {}
            
            # 使用预览信息作为初始值 📋
            if "citations_preview" in paper_info:
                details['citations'] = paper_info["citations_preview"]
                print(f"    📈 使用预览引用次数: {details['citations']}")
            
            if "year_preview" in paper_info and paper_info["year_preview"]:
                details['year'] = paper_info["year_preview"]
                print(f"    📅 使用预览年份: {details['year']}")
            
            # 提取标题 📝
            try:
                title_elem = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "#gsc_oci_title"))
                )
                details['title'] = title_elem.text.strip()
            except TimeoutException:
                details['title'] = "Unknown Title"
            
            # 提取所有作者 👥
            try:
                authors_elem = self.driver.find_element(By.CSS_SELECTOR, ".gsc_oci_value[data-testid='authors']")
                authors_text = authors_elem.text.strip()
                # 分割作者名字，处理各种分隔符
                authors = [author.strip() for author in re.split(r',|;|and', authors_text) if author.strip()]
                details['authors'] = authors
            except NoSuchElementException:
                details['authors'] = ["Unknown Author"]
            
            # 提取所有字段信息 📋
            field_rows = self.driver.find_elements(By.CSS_SELECTOR, ".gsc_oci_field")
            
            for field in field_rows:
                try:
                    field_name = field.text.strip().lower()
                    value_elem = field.find_element(By.XPATH, "./following-sibling::div[1]")
                    value = value_elem.text.strip()
                    
                    # 根据字段类型处理数据 🏷️
                    if "publication date" in field_name or "date" in field_name:
                        details['date'] = value
                        # 提取年份
                        year_match = re.search(r'\d{4}', value)
                        if year_match:
                            details['year'] = int(year_match.group())
                    
                    elif "journal" in field_name or "conference" in field_name or "venue" in field_name:
                        details['venue'] = value
                        # 判断venue类型
                        if any(conf_word in value.lower() for conf_word in ['conference', 'workshop', 'symposium', 'proceedings']):
                            details['venueType'] = 'conference'
                        elif any(journal_word in value.lower() for journal_word in ['journal', 'transactions', 'letters']):
                            details['venueType'] = 'journal'
                        elif 'arxiv' in value.lower():
                            details['venueType'] = 'arxiv'
                        else:
                            details['venueType'] = 'other'
                    
                    elif "description" in field_name or "abstract" in field_name:
                        details['description'] = value
                    
                    elif "total citations" in field_name or "cited by" in field_name or "引用" in field_name:
                        # 提取数字引用次数
                        citation_num = re.search(r'\d+', value)
                        if citation_num:
                            details['citations'] = int(citation_num.group())
                        else:
                            details['citations'] = value
                        print(f"    📈 引用次数: {details['citations']}")
                        
                except Exception as e:
                    print(f"    ⚠️ 提取字段时出错 '{field_name}': {e}")
                    continue
            
            # 生成简短venue名称 🏷️
            if 'venue' in details:
                details['venueShort'] = self.generate_venue_short(details['venue'])
            
            # 如果没有找到citation，尝试其他方法提取 📈
            if 'citations' not in details:
                try:
                    # 方法1: 查找"Cited by"链接
                    cited_by_elem = self.driver.find_element(By.CSS_SELECTOR, "a[href*='cites']")
                    if cited_by_elem:
                        cited_text = cited_by_elem.text.strip()
                        citation_match = re.search(r'(\d+)', cited_text)
                        if citation_match:
                            details['citations'] = int(citation_match.group(1))
                            print(f"    📈 通过cited by链接提取引用次数: {details['citations']}")
                except:
                    pass
                
                # 方法2: 查找citation计数器
                if 'citations' not in details:
                    try:
                        citation_elements = self.driver.find_elements(By.CSS_SELECTOR, ".gsc_oci_value")
                        for elem in citation_elements:
                            text = elem.text.strip()
                            if text.isdigit():
                                details['citations'] = int(text)
                                print(f"    📈 通过数字元素提取引用次数: {details['citations']}")
                                break
                    except:
                        pass
                
                # 如果仍然没有找到，设置为0
                if 'citations' not in details:
                    details['citations'] = 0
                    print(f"    📈 未找到引用信息，设置为: 0")
            
            # 自动生成标签 🏷️
            details['tags'] = self.generate_tags(details)
            
            return details
            
        except Exception as e:
            print(f"    ❌ 提取论文详情时出错: {e}")
            return None
    
    def generate_venue_short(self, venue_full):
        """
        🏷️ 生成venue的简短名称
        
        优先级：
        1. 提取括号中的缩写 (如 ISBI, CVPR)
        2. 使用预定义映射
        3. 如果名称较短，直接使用原名称
        4. 否则生成首字母缩写
        
        Args:
            venue_full (str): 完整的venue名称
            
        Returns:
            str: 简短的venue名称
        """
        if not venue_full:
            return "Unknown"
        
        # 1. 🔍 首先检查是否有括号中的缩写
        import re
        bracket_match = re.search(r'\(([A-Z]+[A-Z0-9]*)\)', venue_full)
        if bracket_match:
            acronym = bracket_match.group(1)
            # 验证是否为有效缩写（主要是大写字母）
            if len(acronym) >= 2 and acronym.isupper():
                print(f"    🏷️ 提取括号缩写: {acronym}")
                return acronym
        
        # 2. 📚 使用预定义的常见缩写映射
        abbreviations = {
            'arxiv preprint': 'ArXiv',
            'nature machine intelligence': 'NMI',
            'ieee transactions on pattern analysis and machine intelligence': 'TPAMI',
            'journal of machine learning research': 'JMLR',
            'proceedings of the national academy of sciences': 'PNAS',
            'nature communications': 'Nat Commun',
            'nature methods': 'Nat Methods',
            'nature biotechnology': 'Nat Biotechnol',
            'science': 'Science',
            'cell': 'Cell'
        }
        
        venue_lower = venue_full.lower().strip()
        for full_name, short_name in abbreviations.items():
            if full_name in venue_lower:
                print(f"    🏷️ 使用预定义映射: {short_name}")
                return short_name
        
        # 3. 📏 如果名称较短，直接使用原名称
        clean_venue = re.sub(r'\([^)]*\)', '', venue_full).strip()  # 移除括号内容
        words = clean_venue.split()
        
        if len(words) <= 2:
            print(f"    🏷️ 名称较短，直接使用: {clean_venue}")
            return clean_venue
        
        # 4. 🔤 生成首字母缩写（排除常见介词和连词）
        stop_words = {'and', 'of', 'the', 'in', 'on', 'for', 'with', 'to', 'a', 'an'}
        meaningful_words = [word for word in words 
                          if len(word) > 1 and word.lower() not in stop_words and word[0].isalpha()]
        
        if len(meaningful_words) >= 2:
            acronym = ''.join([word[0].upper() for word in meaningful_words[:4]])  # 最多取4个词
            print(f"    🏷️ 生成首字母缩写: {acronym}")
            return acronym
        else:
            # 如果实在提取不出来，返回清理后的原名称
            print(f"    🏷️ 无法生成缩写，使用原名称: {clean_venue}")
            return clean_venue
    
    def generate_tags(self, details):
        """
        🏷️ 基于论文信息自动生成标签
        
        Args:
            details (dict): 论文详细信息
            
        Returns:
            list: 生成的标签列表
        """
        tags = []
        title = details.get('title', '').lower()
        description = details.get('description', '').lower()
        venue = details.get('venue', '').lower()
        
        # 技术相关标签
        tech_keywords = {
            'deep learning': 'Deep Learning',
            'machine learning': 'Machine Learning',
            'neural network': 'Neural Networks',
            'transformer': 'Transformer',
            'attention': 'Attention',
            'gnn': 'Graph Neural Networks',
            'graph neural': 'Graph Neural Networks',
            'federated learning': 'Federated Learning',
            'computer vision': 'Computer Vision',
            'nlp': 'NLP',
            'natural language': 'NLP'
        }
        
        # 应用领域标签
        domain_keywords = {
            'medical': 'Medical',
            'healthcare': 'Healthcare',
            'pathology': 'Pathology',
            'drug discovery': 'Drug Discovery',
            'molecular': 'Molecular',
            'quantum': 'Quantum Computing',
            'biomedical': 'Biomedical',
            'clinical': 'Clinical'
        }
        
        all_text = f"{title} {description} {venue}"
        
        # 检查技术关键词
        for keyword, tag in tech_keywords.items():
            if keyword in all_text:
                tags.append(tag)
        
        # 检查应用领域关键词
        for keyword, tag in domain_keywords.items():
            if keyword in all_text:
                tags.append(tag)
        
        # 如果没有标签，添加一个通用标签
        if not tags:
            tags.append("Research")
        
        return list(set(tags))  # 去重
    
    def crawl_all_papers(self, base_url):
        """
        🚀 爬取所有论文的详细信息
        
        Args:
            base_url (str): Google Scholar个人主页URL
        """
        try:
            # 获取所有论文的基本信息
            papers = self.get_all_papers(base_url)
            
            print(f"\n📋 开始爬取 {len(papers)} 篇论文的详细信息...")
            
            for i, paper in enumerate(papers, 1):
                print(f"\n📄 正在处理第 {i}/{len(papers)} 篇论文: {paper['title'][:50]}...")
                
                details = self.extract_paper_details(paper)
                
                if details:
                    # 生成唯一ID
                    paper_id = f"pub-{i:03d}"
                    details['id'] = paper_id
                    
                    self.publications.append(details)
                    print(f"  ✅ 成功提取论文信息")
                else:
                    print(f"  ❌ 提取论文信息失败")
                
                # 添加延迟避免被封
                time.sleep(1)
            
            print(f"\n🎉 爬取完成！总共成功处理 {len(self.publications)} 篇论文")
            
        except Exception as e:
            print(f"❌ 爬取过程中出现错误: {e}")
    
    def save_to_yaml(self, filename="scraped_publications.yaml"):
        """
        💾 将爬取的数据保存为YAML文件
        
        Args:
            filename (str): 保存的文件名
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                yaml.dump(self.publications, f, default_flow_style=False, 
                         allow_unicode=True, sort_keys=False, indent=2)
            print(f"💾 数据已保存到 {filename}")
        except Exception as e:
            print(f"❌ 保存文件时出错: {e}")
    
    def close(self):
        """
        🔒 关闭浏览器
        """
        self.driver.quit()
        print("🔒 浏览器已关闭")

def main():
    """
    🚀 主函数：执行爬虫任务
    """
    # Google Scholar个人主页URL
    url = "https://scholar.google.com/citations?hl=en&user=X7KrguAAAAAJ&view_op=list_works&sortby=pubdate"
    
    # 创建爬虫实例
    crawler = GoogleScholarCrawler(headless=False)  # 设置为True可启用无头模式
    
    try:
        # 开始爬取
        crawler.crawl_all_papers(url)
        
        # 保存数据
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"publications_{timestamp}.yaml"
        crawler.save_to_yaml(filename)
        
    except Exception as e:
        print(f"❌ 程序执行出错: {e}")
    finally:
        # 确保关闭浏览器
        crawler.close()

if __name__ == "__main__":
    main()
