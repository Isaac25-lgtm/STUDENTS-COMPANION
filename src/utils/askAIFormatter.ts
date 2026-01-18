/**
 * Ask AI Response Formatter
 * Converts custom HTML-style tags to styled React-compatible HTML
 */

/**
 * Format AI response by converting custom tags and cleaning markdown
 */
export function formatAIResponse(text: string): string {
  if (!text) return '';

  // Step 1: Clean any raw markdown that slipped through
  let formatted = cleanMarkdownToTags(text);

  // Step 2: Convert our custom tags to styled HTML
  formatted = convertTagsToHTML(formatted);

  // Step 3: Clean up whitespace
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted.trim();
}

/**
 * Convert any raw markdown to our tag format (fallback for when AI ignores instructions)
 */
function cleanMarkdownToTags(text: string): string {
  let cleaned = text;

  // Convert **bold** to <b>bold</b>
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

  // Convert *italic* to <i>italic</i>
  cleaned = cleaned.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<i>$1</i>');

  // Convert ## Heading to <h>Heading</h>
  cleaned = cleaned.replace(/^##\s*(.+)$/gm, '<h>$1</h>');
  cleaned = cleaned.replace(/^###\s*(.+)$/gm, '<h>$1</h>');

  // Convert numbered headings like "1. The Big Picture" to <h>
  cleaned = cleaned.replace(/^(\d+)\.\s+([A-Z][^.!?\n]{3,})$/gm, '<h>$1. $2</h>');

  // Convert --- horizontal rules to nothing
  cleaned = cleaned.replace(/^-{3,}$/gm, '');
  cleaned = cleaned.replace(/^\*{3,}$/gm, '');

  // Convert bullet points at start of line to <li>
  cleaned = cleaned.replace(/^[•\-\*]\s*(.+)$/gm, '<li>$1</li>');

  // Convert numbered lists "1. item" (but not headers) to <step>
  cleaned = cleaned.replace(/^(\d+)\.\s+(?![A-Z][^.!?\n]{3,}$)(.+)$/gm, '<step n="$1">$2</step>');

  return cleaned;
}

/**
 * Convert our custom tags to properly styled HTML
 */
function convertTagsToHTML(text: string): string {
  let html = text;

  // <b>text</b> → bold with accent color
  html = html.replace(
    /<b>([^<]+)<\/b>/g,
    '<span class="font-semibold text-gray-900 dark:text-white">$1</span>'
  );

  // <i>text</i> → italic
  html = html.replace(
    /<i>([^<]+)<\/i>/g,
    '<span class="italic text-gray-700 dark:text-gray-300">$1</span>'
  );

  // <h>Section Title</h> → styled header
  html = html.replace(
    /<h>([^<]+)<\/h>/g,
    '<div class="text-lg font-bold text-violet-700 dark:text-violet-400 mt-6 mb-3 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-violet-500"></span>$1</div>'
  );

  // <key>concept</key> → highlighted key concept
  html = html.replace(
    /<key>([^<]+)<\/key>/g,
    '<span class="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-medium">$1</span>'
  );

  // <tip>text</tip> → tip box
  html = html.replace(
    /<tip>([^<]+)<\/tip>/g,
    '<div class="bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-emerald-500 p-4 my-4 rounded-r-lg"><span class="text-emerald-700 dark:text-emerald-400 font-medium">💡 Tip:</span> <span class="text-emerald-800 dark:text-emerald-300">$1</span></div>'
  );

  // <warn>text</warn> → warning box
  html = html.replace(
    /<warn>([^<]+)<\/warn>/g,
    '<div class="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 my-4 rounded-r-lg"><span class="text-orange-700 dark:text-orange-400 font-medium">⚠️ Important:</span> <span class="text-orange-800 dark:text-orange-300">$1</span></div>'
  );

  // <li>item</li> → styled list item
  html = html.replace(
    /<li>([^<]+)<\/li>/g,
    '<div class="flex items-start gap-3 my-2"><span class="w-2 h-2 rounded-full bg-violet-400 mt-2 flex-shrink-0"></span><span class="text-gray-700 dark:text-gray-300">$1</span></div>'
  );

  // <step n="1">text</step> → numbered step
  html = html.replace(
    /<step n="(\d+)">([^<]+)<\/step>/g,
    '<div class="flex items-start gap-3 my-3"><span class="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 flex items-center justify-center text-sm font-bold flex-shrink-0">$1</span><span class="text-gray-700 dark:text-gray-300 pt-0.5">$2</span></div>'
  );

  // <def term="Term">definition</def> → definition box
  html = html.replace(
    /<def term="([^"]+)">([^<]+)<\/def>/g,
    '<div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 my-4 rounded-lg"><div class="font-semibold text-blue-800 dark:text-blue-300 mb-1">📖 $1</div><div class="text-blue-700 dark:text-blue-400 text-sm">$2</div></div>'
  );

  // <ex>example</ex> → example box
  html = html.replace(
    /<ex>([^<]+)<\/ex>/g,
    '<div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 my-4 rounded-lg"><span class="text-gray-500 dark:text-gray-400 text-sm font-medium">Example:</span><div class="text-gray-700 dark:text-gray-300 mt-1">$1</div></div>'
  );

  // <formula>equation</formula> → formula box
  html = html.replace(
    /<formula>([^<]+)<\/formula>/g,
    '<div class="bg-slate-100 dark:bg-slate-800 p-4 my-4 rounded-lg text-center font-mono text-lg text-slate-800 dark:text-slate-200">$1</div>'
  );

  // <analogy>text</analogy> → analogy callout
  html = html.replace(
    /<analogy>([^<]+)<\/analogy>/g,
    '<div class="bg-purple-50 dark:bg-purple-900/30 border-l-4 border-purple-400 p-4 my-4 rounded-r-lg italic text-purple-800 dark:text-purple-300"><span class="not-italic">🎯</span> $1</div>'
  );

  // Convert double newlines to paragraph breaks
  html = html.replace(/\n\n/g, '</p><p class="my-3 text-gray-700 dark:text-gray-300 leading-relaxed">');
  html = html.replace(/\n/g, ' ');

  // Wrap in paragraph if not already wrapped with a tag
  if (!html.startsWith('<')) {
    html = `<p class="my-3 text-gray-700 dark:text-gray-300 leading-relaxed">${html}</p>`;
  }

  return html;
}

/**
 * Parse response into structured blocks for React components
 */
export interface ContentBlock {
  type: 'text' | 'header' | 'tip' | 'warning' | 'list_item' | 'step' | 'definition' | 'example' | 'formula' | 'analogy' | 'key_concept';
  content: string;
  number?: string;
  term?: string;
}

export function parseToBlocks(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Clean markdown first
  let cleaned = cleanMarkdownToTags(text);

  // Split into segments based on our tags
  const pattern = /(<(?:h|key|tip|warn|li|step|def|ex|formula|analogy|b|i)[^>]*>[\s\S]*?<\/(?:h|key|tip|warn|li|step|def|ex|formula|analogy|b|i)>)/;

  const segments = cleaned.split(pattern).filter(s => s.trim());

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    // Determine segment type
    if (trimmed.startsWith('<h>')) {
      const content = trimmed.replace(/<h>(.+)<\/h>/, '$1');
      blocks.push({ type: 'header', content });
    } else if (trimmed.startsWith('<tip>')) {
      const content = trimmed.replace(/<tip>(.+)<\/tip>/, '$1');
      blocks.push({ type: 'tip', content });
    } else if (trimmed.startsWith('<warn>')) {
      const content = trimmed.replace(/<warn>(.+)<\/warn>/, '$1');
      blocks.push({ type: 'warning', content });
    } else if (trimmed.startsWith('<li>')) {
      const content = trimmed.replace(/<li>(.+)<\/li>/, '$1');
      blocks.push({ type: 'list_item', content });
    } else if (trimmed.startsWith('<step')) {
      const match = trimmed.match(/<step n="(\d+)">(.+)<\/step>/);
      if (match) {
        blocks.push({ type: 'step', number: match[1], content: match[2] });
      }
    } else if (trimmed.startsWith('<def')) {
      const match = trimmed.match(/<def term="([^"]+)">(.+)<\/def>/);
      if (match) {
        blocks.push({ type: 'definition', term: match[1], content: match[2] });
      }
    } else if (trimmed.startsWith('<ex>')) {
      const content = trimmed.replace(/<ex>(.+)<\/ex>/, '$1');
      blocks.push({ type: 'example', content });
    } else if (trimmed.startsWith('<formula>')) {
      const content = trimmed.replace(/<formula>(.+)<\/formula>/, '$1');
      blocks.push({ type: 'formula', content });
    } else if (trimmed.startsWith('<analogy>')) {
      const content = trimmed.replace(/<analogy>(.+)<\/analogy>/, '$1');
      blocks.push({ type: 'analogy', content });
    } else if (trimmed.startsWith('<key>')) {
      const content = trimmed.replace(/<key>(.+)<\/key>/, '$1');
      blocks.push({ type: 'key_concept', content });
    } else {
      // Regular text - clean inline formatting for display
      let textContent = trimmed;
      textContent = textContent.replace(/<b>(.+?)<\/b>/g, '**$1**');
      textContent = textContent.replace(/<i>(.+?)<\/i>/g, '*$1*');
      if (textContent.trim()) {
        blocks.push({ type: 'text', content: textContent.trim() });
      }
    }
  }

  return blocks;
}
