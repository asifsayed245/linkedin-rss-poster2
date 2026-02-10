export interface Article {
  title: string;
  link: string;
  content: string;
  contentSnippet?: string;
  pubDate: string;
  source: string;
  category: string;
  guid?: string;
}

export interface LinkedInPost {
  articleId: number;
  originalTitle: string;
  url: string;
  summary: string;
  content: string;
  hashtags: string[];
  status: 'draft' | 'approved' | 'posted' | 'rejected';
  createdAt: string;
}

export const sources = [
  // --- AI News ---
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
    url: 'https://us12.campaign-archive.com/feed?u=f39692e245b94f7fb693b6d82&id=93051a3d5e',
    category: 'ai',
    enabled: false, // Often requires parsing email format
  },

  // --- General Tech ---
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
  
  // --- Science / Research ---
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'science',
    enabled: true,
  },
  {
    name: 'Hacker News (AI/Tech)',
    url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+Machine+Learning',
    category: 'tech',
    enabled: true,
  }
];
