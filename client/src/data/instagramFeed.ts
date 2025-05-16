// Arquivo com dados do feed do Instagram da Câmara de Jaíba
export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  date: string;
}

// Dados de exemplo que representam o feed @camaradejaiba
export const instagramFeed: InstagramPost[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1464692805480-a69dfaafdb0d?w=500&auto=format&fit=crop&q=60',
    caption: 'Sessão extraordinária na Câmara Municipal de Jaíba para discussão de projetos prioritários',
    likes: 48,
    date: '2023-11-10'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60',
    caption: 'Reunião da comissão especial para análise do orçamento municipal de 2024',
    likes: 32,
    date: '2023-11-05'
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&auto=format&fit=crop&q=60',
    caption: 'Audiência pública sobre melhorias na infraestrutura do município',
    likes: 65,
    date: '2023-10-28'
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1507137903531-34be734e5b1b?w=500&auto=format&fit=crop&q=60',
    caption: 'Homenagem aos servidores públicos municipais na Câmara de Jaíba',
    likes: 41,
    date: '2023-10-20'
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=500&auto=format&fit=crop&q=60',
    caption: 'Cerimônia de premiação dos alunos destaques da rede municipal de ensino',
    likes: 57,
    date: '2023-10-15'
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1561489396-2da385eccd49?w=500&auto=format&fit=crop&q=60',
    caption: 'Participação da Câmara de Jaíba na conferência estadual de legislativos municipais',
    likes: 38,
    date: '2023-10-08'
  }
];