export type Chapter = {
  id: string;
  title: string;
  content: string;
  order: number;
  updatedAt: number;
};

// How the physical keyboard is interpreted in the editor:
//   taglish  — romanized input transliterates to Tamil live
//   pm0100   — laptop QWERTY keys map to the PM0100 Tamil layout (Shift = nedil)
//   english  — raw passthrough for names/quotes
export type InputMode = 'taglish' | 'pm0100' | 'english';
