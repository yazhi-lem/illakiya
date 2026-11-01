/** Tools in the Illakiya toolbox. `translit` runs offline in the browser. */
export type ToolId = 'clean' | 'translate' | 'grammar' | 'formal' | 'translit';

export type Tool = {
  id: ToolId;
  label: string;
  hint: string;
  /** Runs locally, instantly, without the network. */
  offline?: boolean;
};
