export type Post = {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: string;
  author?: string;
  date?: string;
  comments_count?: number;
  likes_count?: number;
  views?: number;
  views_count?: number;
};

export type Comment = {
  username: string;
  content: string;
  created_at: string;
};
