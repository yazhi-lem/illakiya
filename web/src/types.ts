export type AppView = 'editor' | 'tutor';

export type Chapter = {
  id: string;
  title: string;
  content: string;
  order: number;
  updatedAt: number;
};

export type Lesson = {
  id: string;
  title: string;
  goal: string;
  keys: string[];
};
