export type Article = {
  id: string;
  title: string;
  folder: string;
  language: string;
}

export type PlaylistItem = {
  id: string;
  title: string;
  type: 'youtube' | 'spotify';
  url: string;
}
