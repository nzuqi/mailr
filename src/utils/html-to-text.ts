// Minimal entity decoder (covers common named + numeric entities)
const decodeEntities = (input: string): string => {
  if (!input) {
    return '';
  }

  // Numeric (hex & dec): &#x27;  &#39;
  const numericDecoded = input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));

  // Common named entities
  return numericDecoded
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
};

export const htmlToText = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let s = html;

  // 1) Remove content we never want in text
  s = s.replace(/<\s*(script|style|noscript|template|head)[\s\S]*?<\/\s*\1\s*>/gi, '');

  // 2) Normalize common structural elements into line breaks
  // <br> and <hr> → newline
  s = s.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  s = s.replace(/<\s*hr\s*\/?\s*>/gi, '\n');

  // Block closers → blank line (paragraph break)
  s = s.replace(/<\/\s*(p|div|section|article|header|footer|aside|form|nav|main|figure|figcaption|h[1-6])\s*>/gi, '\n\n');

  // Lists: each <li> on its own line with a bullet
  s = s.replace(/<\s*li[^>]*>/gi, '\n• ').replace(/<\/\s*li\s*>/gi, '');

  // End of lists → newline
  s = s.replace(/<\/\s*(ul|ol)\s*>/gi, '\n');

  // Tables: cells separated by tabs, rows by newlines
  s = s
    .replace(/<\/\s*(td|th)\s*>/gi, '\t')
    .replace(/<\/\s*tr\s*>/gi, '\n')
    .replace(/<\/\s*(thead|tbody|tfoot|table)\s*>/gi, '\n');

  // Blockquotes: prefix with "> "
  s = s.replace(/<\s*blockquote[^>]*>/gi, '\n> ').replace(/<\/\s*blockquote\s*>/gi, '\n');

  // 3) Strip remaining tags
  s = s.replace(/<[^>]+>/g, '');

  // 4) Decode HTML entities (basic & numeric)
  s = decodeEntities(s);

  // 5) Whitespace normalization
  // Convert tabs (from table cells) to 2 spaces
  s = s.replace(/\t/g, '  ');

  // Collapse 3+ newlines to 2 (paragraph spacing)
  s = s.replace(/\n{3,}/g, '\n\n');

  // Trim trailing spaces on each line
  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t]+\r?$/g, '').replace(/^\s+/, ''))
    .join('\n');

  // Collapse multiple spaces (but keep single spaces)
  s = s.replace(/[ \u00A0]{2,}/g, ' ');

  // Final trim
  return s.trim();
};
