export type AppView = 'editor' | 'tutor';

export type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
};

export type Lesson = {
  id: string;
  title: string;
  goal: string;
  keys: string[];
};
