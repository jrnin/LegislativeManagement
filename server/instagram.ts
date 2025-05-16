import InstagramWebApi from 'instagram-web-api';
import { Request, Response } from 'express';

interface InstagramPost {
  id: string;
  url: string;
  thumbnailUrl: string;
  displayUrl: string;
  caption?: string;
}

// Função para buscar posts do Instagram
export async function fetchInstagramPosts(username: string, count: number = 6): Promise<InstagramPost[]> {
  try {
    // Verificar se as credenciais do Instagram estão disponíveis
    if (!process.env.INSTAGRAM_USERNAME || !process.env.INSTAGRAM_PASSWORD) {
      console.error('Credenciais do Instagram não configuradas');
      return getSamplePosts(); // Usar posts de amostra se não houver credenciais
    }

    const client = new InstagramWebApi({
      username: process.env.INSTAGRAM_USERNAME,
      password: process.env.INSTAGRAM_PASSWORD
    });

    try {
      // Fazer login no Instagram
      await client.login();
      
      // Buscar perfil pelo username
      const userResult = await client.getUserByUsername({ username });
      
      if (!userResult || !userResult.user) {
        console.error(`Usuário ${username} não encontrado`);
        return getSamplePosts();
      }

      // Buscar posts do usuário
      const userId = userResult.user.id;
      const feed = await client.getPhotosByUserId({ id: userId, first: count });
      
      if (!feed || !feed.edges) {
        console.error('Não foi possível carregar o feed');
        return getSamplePosts();
      }

      // Converter para nosso formato
      return feed.edges.map((edge: any) => ({
        id: edge.node.id,
        url: `https://www.instagram.com/p/${edge.node.shortcode}/`,
        thumbnailUrl: edge.node.thumbnail_src,
        displayUrl: edge.node.display_url,
        caption: edge.node.edge_media_to_caption?.edges[0]?.node?.text || '',
      }));
    } finally {
      // Fazer logout para liberar a sessão
      await client.logout();
    }
  } catch (error) {
    console.error('Erro ao buscar posts do Instagram:', error);
    return getSamplePosts();
  }
}

// Manipulador de rota para a API
export async function getInstagramFeed(req: Request, res: Response) {
  try {
    const username = req.query.username as string || 'camaradejaiba';
    const count = parseInt(req.query.count as string) || 6;
    
    const posts = await fetchInstagramPosts(username, count);
    res.json(posts);
  } catch (error) {
    console.error('Erro ao processar requisição de feed do Instagram:', error);
    res.status(500).json({ 
      error: 'Falha ao carregar feed do Instagram',
      posts: getSamplePosts()
    });
  }
}

// Função para obter posts de amostra como fallback
function getSamplePosts(): InstagramPost[] {
  return [
    {
      id: '1',
      url: 'https://www.instagram.com/camaradejaiba/',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464692805480-a69dfaafdb0d?w=500',
      displayUrl: 'https://images.unsplash.com/photo-1464692805480-a69dfaafdb0d?w=1080',
      caption: 'Sessão extraordinária na Câmara Municipal'
    },
    {
      id: '2',
      url: 'https://www.instagram.com/camaradejaiba/',
      thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500',
      displayUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1080',
      caption: 'Reunião da comissão especial'
    },
    {
      id: '3',
      url: 'https://www.instagram.com/camaradejaiba/',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=500',
      displayUrl: 'https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=1080',
      caption: 'Audiência pública sobre o orçamento municipal'
    },
    {
      id: '4',
      url: 'https://www.instagram.com/camaradejaiba/',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500',
      displayUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1080',
      caption: 'Homenagem aos servidores públicos'
    },
    {
      id: '5',
      url: 'https://www.instagram.com/camaradejaiba/',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500',
      displayUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1080',
      caption: 'Debate sobre projetos de infraestrutura'
    },
    {
      id: '6',
      url: 'https://www.instagram.com/camaradejaiba/',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541848756149-e3843fcbf0c7?w=500',
      displayUrl: 'https://images.unsplash.com/photo-1541848756149-e3843fcbf0c7?w=1080',
      caption: 'Cerimônia de posse dos novos vereadores'
    }
  ];
}