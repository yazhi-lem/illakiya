import type { ReactNode } from 'react';

/**
 * Minimal, safe Markdown for model output: #/##/### headings, paragraphs,
 * "-"/"*" and "1." lists, **bold**, and [links](https://…). Builds React
 * elements only — no HTML injection.
 */

type Block =
  | { kind: 'h'; level: 1 | 2 | 3; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] };

export function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null;

  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join('\n') });
    para = [];
    if (list) blocks.push(list);
    list = null;
  };

  for (const line of src.split('\n')) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const bullet = /^\s*[-*•]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);

    if (heading) {
      flush();
      blocks.push({ kind: 'h', level: heading[1].length as 1 | 2 | 3, text: heading[2] });
    } else if (bullet || ordered) {
      const kind = bullet ? 'ul' : 'ol';
      if (para.length || (list && list.kind !== kind)) flush();
      if (!list) list = { kind, items: [] };
      list.items.push((bullet ?? ordered)![1]);
    } else if (!line.trim()) {
      flush();
    } else {
      if (list) flush();
      para.push(line);
    }
  }
  flush();
  return blocks;
}

const INLINE = /(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g;

export function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

export function Markdown({ text }: { text: string }) {
  return (
    <>
      {parseBlocks(text).map((block, i) => {
        if (block.kind === 'h') {
          const Tag = (['h2', 'h3', 'h4'] as const)[block.level - 1];
          return <Tag key={i}>{renderInline(block.text)}</Tag>;
        }
        if (block.kind === 'p') return <p key={i}>{renderInline(block.text)}</p>;
        const List = block.kind;
        return (
          <List key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </List>
        );
      })}
    </>
  );
}
