export type AppView = 'editor' | 'tutor';

export type Note = {
  id: string;
  title: string;
  content: string; // HTML from contenteditable
  updatedAt: number;
  createdAt: number;
};

export type Lesson = {
  id: string;
  title: string;
  goal: string;
  keys: string[];
};

export type FormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
};
