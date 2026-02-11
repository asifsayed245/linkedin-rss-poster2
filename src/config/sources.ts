export interface RssSource {
  name: string;
  url: string;
  category: 'ai' | 'tech' | 'science';
  enabled: boolean;
}

export const RSS_SOURCES: RssSource[] = [
  // AI-focused sources
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'ai',
    enabled: true,
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    category: 'ai',
    enabled: true,
  },
  {
    name: 'MarkTechPost',
    url: 'https://www.marktechpost.com/feed/',
    category: 'ai',
    enabled: true,
  },
  {
    name: 'AI Weekly',
    url: 'https://aiweekly.co/rss/',
    category: 'ai',
    enabled: true,
  },
  
  // Tech sources
  {
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'tech',
    enabled: true,
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    enabled: true,
  },
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'tech',
    enabled: true,
  },
  {
    name: 'Hacker News (Tech)',
    url: 'https://hnrss.org/newest?q=ai+OR+machine+learning+OR+tech',
    category: 'tech',
    enabled: true,
  },
  
  // Additional AI & Tech sources
  {
    name: 'Hacker News Top',
    url: 'https://news.ycombinator.com/rss',
    category: 'tech',
    enabled: false,
  },
  {
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    category: 'ai',
    enabled: true,
  },
  {
    name: 'Wired AI',
    url: 'https://www.wired.com/feed/category/science/latest/rss',
    category: 'ai',
    enabled: true,
  },
  {
    name: 'FT AI',
    url: 'https://www.ft.com/artificial-intelligence?format=rss',
    category: 'ai',
    enabled: true,
  },
];

export interface Article {
  id?: number;
  title: string;
  link: string;
  content: string;
  summary?: string;
  source: string;
  category: string;
  publishedAt: Date;
  fetchedAt: Date;
  processed: boolean;
}

export interface LinkedInPost {
  id?: number;
  articleId: number;
  content: string;
  hashtags: string[];
  createdAt: Date;
  status: 'draft' | 'approved' | 'posted';
  postedAt?: Date;
  imageUrl?: string;
  infographicPath?: string;
  hasImage?: boolean;
}
