import Link from "next/link";
import type { ReactNode } from "react";

type Inline = string | ReactNode;

function safeHref(href: string) {
  if (href.startsWith("/") || href.startsWith("#")) return href;
  if (/^https?:\/\//i.test(href)) return href;
  return null;
}

function inline(text: string, keyPrefix = "i"): Inline[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const pieces = text.split(pattern).filter((piece) => piece !== "");
  return pieces.map((piece, index) => {
    const key = `${keyPrefix}-${index}`;
    if (piece.startsWith("**") && piece.endsWith("**")) {
      return <strong key={key}>{piece.slice(2, -2)}</strong>;
    }
    if (piece.startsWith("*") && piece.endsWith("*") && piece.length > 2) {
      return <em key={key}>{piece.slice(1, -1)}</em>;
    }
    if (piece.startsWith("`") && piece.endsWith("`")) {
      return <code key={key}>{piece.slice(1, -1)}</code>;
    }
    const link = piece.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return <span key={key}>{link[1]}</span>;
      if (href.startsWith("/")) {
        return (
          <Link key={key} href={href} className="link-gold">
            {link[1]}
          </Link>
        );
      }
      return (
        <a key={key} href={href} target="_blank" rel="noreferrer noopener" className="link-gold">
          {link[1]}
        </a>
      );
    }
    return piece;
  });
}

/** Renders a practical subset of Markdown: headings, lists, quotes, tables, rules, bold/italic/links. */
export function MarkdownLite({ text, className = "legal-prose" }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} />);
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const content = inline(heading[2], `h${key}`);
      blocks.push(
        heading[1].length <= 2 ? (
          <h3 key={key++} className="!mt-5 !mb-2 !text-[1.15rem]">
            {content}
          </h3>
        ) : (
          <h4 key={key++} className="!mt-4 !mb-1.5 !text-[0.98rem]">
            {content}
          </h4>
        ),
      );
      i += 1;
      continue;
    }

    if (line.trimStart().startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push(<blockquote key={key++}>{inline(quote.join(" "), `q${key}`)}</blockquote>);
      continue;
    }

    if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const header = line.split("|").slice(1, -1).map((cell) => cell.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
        rows.push(lines[i].split("|").slice(1, -1).map((cell) => cell.trim()));
        i += 1;
      }
      blocks.push(
        <div key={key++} className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {header.map((cell, index) => (
                  <th key={index}>{inline(cell, `th${key}-${index}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{inline(cell, `td${key}-${rowIndex}-${cellIndex}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^\s*[-*•]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (
        i < lines.length &&
        (ordered ? /^\s*\d+[.)]\s+/.test(lines[i]) : /^\s*[-*•]\s+/.test(lines[i]))
      ) {
        items.push(lines[i].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/, ""));
        i += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={key++}>
          {items.map((item, index) => (
            <li key={index}>{inline(item, `li${key}-${index}`)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s/.test(lines[i]) &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !lines[i].trimStart().startsWith(">") &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p key={key++}>{inline(paragraph.join(" "), `p${key}`)}</p>,
    );
  }

  return <div className={className}>{blocks}</div>;
}
