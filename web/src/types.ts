/** What the server did with a message (detected or forced). */
export type Intent = 'write' | 'research' | 'clean' | 'translate' | 'grammar' | 'formal' | 'revise';

/** Composer modes. `auto` lets Illakiya detect the intent; `translit` runs offline. */
export type Mode = 'auto' | 'research' | 'clean' | 'translate' | 'grammar' | 'formal' | 'translit';

export type Tool = {
  id: Mode;
  label: string;
  hint: string;
  placeholder: string;
  /** Runs locally, instantly, without the network. */
  offline?: boolean;
};

export type Source = { url: string; title: string };

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** User: the mode it was sent with. */
  mode: Mode;
  /** Assistant: what Illakiya did, and whether it detected that itself. */
  intent?: Intent;
  auto?: boolean;
  searches?: string[];
  sources?: Source[];
  note?: string;
  error?: string;
  pending?: boolean;
};
