/** Modes in the Illakiya composer. `translit` runs offline in the browser. */
export type ServerToolId = 'write' | 'clean' | 'translate' | 'grammar' | 'formal';
export type ToolId = ServerToolId | 'translit';

export type Tool = {
  id: ToolId;
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
  /** Mode a user message was sent with. */
  tool: ToolId;
  /** Assistant only: web searches made while writing. */
  searches?: string[];
  sources?: Source[];
  note?: string;
  error?: string;
  pending?: boolean;
};
