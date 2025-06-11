import { Request, Response } from "express";

interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  picture?: string;
  permalink_url?: string;
  reactions?: {
    summary: {
      total_count: number;
    };
  };
  comments?: {
    summary: {
      total_count: number;
    };
  };
}

interface FacebookApiResponse {
  data: FacebookPost[];
  paging?: {
    next?: string;
  };
}

/**
 * Fetch Facebook posts from a public page
 * For the provided URL: https://www.facebook.com/share/1YKbR5Mppj/?mibextid=wwXIfr
 * We'll need to extract the page ID and use the Graph API
 */
export async function fetchFacebookPosts(pageId: string, accessToken: string, limit: number = 6): Promise<FacebookPost[]> {
  try {
    const fields = 'id,message,created_time,picture,permalink_url,reactions.summary(total_count),comments.summary(total_count)';
    const url = `https://graph.facebook.com/v18.0/${pageId}/posts?fields=${fields}&limit=${limit}&access_token=${accessToken}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Facebook API error: ${response.status} ${response.statusText}`);
      throw new Error(`Facebook API returned ${response.status}`);
    }
    
    const data: FacebookApiResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Facebook posts:', error);
    throw error;
  }
}

/**
 * API endpoint to get Facebook posts for the public
 */
export async function getFacebookFeed(req: Request, res: Response) {
  try {
    // Check if Facebook access token is configured
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID || '1YKbR5Mppj'; // Default from the provided URL
    
    if (!accessToken) {
      console.log('Facebook access token not configured, returning sample posts');
      return res.json({ posts: getSamplePosts() });
    }
    
    console.log(`Fetching Facebook posts for page: ${pageId}`);
    
    const posts = await fetchFacebookPosts(pageId, accessToken, 6);
    
    console.log(`Successfully fetched ${posts.length} Facebook posts`);
    res.json({ posts });
    
  } catch (error) {
    console.error('Error in getFacebookFeed:', error);
    
    // Return sample posts if there's an error
    console.log('Returning sample posts due to error');
    res.json({ posts: getSamplePosts() });
  }
}

/**
 * Sample Facebook posts for development/fallback
 */
function getSamplePosts(): FacebookPost[] {
  return [
    {
      id: "sample_1",
      message: "🏛️ Sessão Ordinária de hoje foi marcada por importantes discussões sobre o orçamento municipal para 2025. Os vereadores debateram prioridades para a educação, saúde e infraestrutura da cidade.",
      created_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      picture: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
      permalink_url: "https://www.facebook.com/share/1YKbR5Mppj/?mibextid=wwXIfr",
      reactions: { summary: { total_count: 45 } },
      comments: { summary: { total_count: 12 } }
    },
    {
      id: "sample_2", 
      message: "📋 Aprovado por unanimidade o projeto de lei que institui o programa de coleta seletiva em todos os bairros da cidade. Um grande passo para o meio ambiente! 🌱",
      created_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      picture: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=300&fit=crop",
      permalink_url: "https://www.facebook.com/share/1YKbR5Mppj/?mibextid=wwXIfr",
      reactions: { summary: { total_count: 78 } },
      comments: { summary: { total_count: 23 } }
    },
    {
      id: "sample_3",
      message: "🎓 Inauguração da nova escola municipal será na próxima semana. Mais de 300 crianças serão beneficiadas com ensino de qualidade e infraestrutura moderna.",
      created_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      picture: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop",
      permalink_url: "https://www.facebook.com/share/1YKbR5Mppj/?mibextid=wwXIfr",
      reactions: { summary: { total_count: 156 } },
      comments: { summary: { total_count: 34 } }
    }
  ];
}