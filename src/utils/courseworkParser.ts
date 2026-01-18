/**
 * Coursework Parser Utility
 * Parses XML-style tags from Gemini output into structured data for clean rendering
 */

export interface ParsedTitlePage {
  mainTitle: string;
  subtitle: string;
  studentName: string;
  university: string;
  course: string;
  lecturer: string;
  date: string;
  wordCount: string;
}

export interface ParsedAbstract {
  content: string;
  keywords: string;
}

export interface ParsedSubsection {
  number: string;
  title: string;
  content: string;
}

export interface ParsedSection {
  number: string;
  title: string;
  content: string;
  subsections: ParsedSubsection[];
}

export interface ParsedCoursework {
  titlePage: ParsedTitlePage;
  abstract: ParsedAbstract;
  sections: ParsedSection[];
  references: string[];
  raw: string;
  parseSuccess: boolean;
}

/**
 * Parse Gemini output into structured data for clean rendering.
 * Handles both the expected tag format AND fallback markdown cleanup.
 */
export function parseCoursework(rawText: string): ParsedCoursework {
  // First, clean any markdown that slipped through
  const text = cleanMarkdown(rawText);
  
  const result: ParsedCoursework = {
    titlePage: {
      mainTitle: '',
      subtitle: '',
      studentName: '',
      university: '',
      course: '',
      lecturer: '',
      date: '',
      wordCount: '',
    },
    abstract: {
      content: '',
      keywords: '',
    },
    sections: [],
    references: [],
    raw: rawText,
    parseSuccess: false,
  };
  
  // Check if we have the XML tag format
  const hasXmlTags = text.includes('<TITLE_PAGE>') || text.includes('<SECTION');
  
  if (hasXmlTags) {
    // Parse title page
    const titleMatch = text.match(/<TITLE_PAGE>([\s\S]*?)<\/TITLE_PAGE>/);
    if (titleMatch) {
      const tp = titleMatch[1];
      result.titlePage = {
        mainTitle: extractTag(tp, 'MAIN_TITLE'),
        subtitle: extractTag(tp, 'SUBTITLE'),
        studentName: extractTag(tp, 'STUDENT_NAME'),
        university: extractTag(tp, 'UNIVERSITY'),
        course: extractTag(tp, 'COURSE'),
        lecturer: extractTag(tp, 'LECTURER'),
        date: extractTag(tp, 'DATE'),
        wordCount: extractTag(tp, 'WORD_COUNT'),
      };
    }
    
    // Parse abstract
    const abstractMatch = text.match(/<ABSTRACT>([\s\S]*?)<\/ABSTRACT>/);
    if (abstractMatch) {
      const ab = abstractMatch[1];
      result.abstract = {
        content: extractTag(ab, 'CONTENT'),
        keywords: extractTag(ab, 'KEYWORDS'),
      };
    }
    
    // Parse sections
    const sectionPattern = /<SECTION num="(\d+)" title="([^"]+)">([\s\S]*?)<\/SECTION>/g;
    let match;
    while ((match = sectionPattern.exec(text)) !== null) {
      const section: ParsedSection = {
        number: match[1],
        title: match[2],
        content: '',
        subsections: [],
      };
      
      const sectionContent = match[3];
      
      // Check for subsections
      const subsectionPattern = /<SUBSECTION num="([\d.]+)" title="([^"]+)">([\s\S]*?)<\/SUBSECTION>/g;
      let subMatch;
      let hasSubsections = false;
      
      while ((subMatch = subsectionPattern.exec(sectionContent)) !== null) {
        hasSubsections = true;
        section.subsections.push({
          number: subMatch[1],
          title: subMatch[2],
          content: cleanContent(subMatch[3]),
        });
      }
      
      if (!hasSubsections) {
        // Remove any subsection tags and get clean content
        section.content = cleanContent(sectionContent.replace(/<SUBSECTION[\s\S]*?<\/SUBSECTION>/g, ''));
      }
      
      result.sections.push(section);
    }
    
    // Parse references
    const referencesMatch = text.match(/<REFERENCES>([\s\S]*?)<\/REFERENCES>/);
    if (referencesMatch) {
      const refs = referencesMatch[1];
      const refPattern = /<REF>([\s\S]*?)<\/REF>/g;
      let refMatch;
      while ((refMatch = refPattern.exec(refs)) !== null) {
        result.references.push(cleanContent(refMatch[1]));
      }
    }
    
    result.parseSuccess = result.sections.length > 0;
  } else {
    // Fallback: Parse markdown-style output
    result.parseSuccess = false;
    
    // Try to extract title from first line
    const lines = text.split('\n');
    const firstNonEmpty = lines.find(l => l.trim().length > 0);
    if (firstNonEmpty) {
      result.titlePage.mainTitle = firstNonEmpty.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
    }
    
    // Extract sections from markdown headers
    const markdownSectionPattern = /(?:^|\n)(?:#{1,3}\s*)?(\d+\.?\s*)([^\n]+)\n([\s\S]*?)(?=(?:\n#{1,3}\s*\d|\n\d+\.\s+[A-Z]|$))/g;
    let sectionNum = 0;
    let mdMatch;
    
    while ((mdMatch = markdownSectionPattern.exec(text)) !== null) {
      sectionNum++;
      const title = mdMatch[2].replace(/\*+/g, '').trim();
      const content = cleanContent(mdMatch[3]);
      
      if (title && content) {
        result.sections.push({
          number: sectionNum.toString(),
          title: title,
          content: content,
          subsections: [],
        });
      }
    }
    
    // If no sections found via pattern, create a single section with all content
    if (result.sections.length === 0) {
      result.sections.push({
        number: '1',
        title: 'Content',
        content: cleanContent(text),
        subsections: [],
      });
    }
  }
  
  return result;
}

/**
 * Extract content between <TAG> and </TAG>
 */
function extractTag(text: string, tagName: string): string {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`);
  const match = text.match(pattern);
  return match ? cleanContent(match[1]) : '';
}

/**
 * Clean text content - remove markdown artifacts
 */
function cleanContent(text: string): string {
  if (!text) return '';
  
  let cleaned = text.trim();
  
  // Remove markdown bold
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  
  // Remove markdown italic
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  
  // Remove markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');
  
  // Remove horizontal rules
  cleaned = cleaned.replace(/^-{3,}$/gm, '');
  cleaned = cleaned.replace(/^\*{3,}$/gm, '');
  
  // Remove code blocks
  cleaned = cleaned.replace(/```[^`]*```/gs, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

/**
 * Fallback cleaner for when Gemini ignores instructions and outputs markdown.
 */
function cleanMarkdown(text: string): string {
  // If already has our tags, return as-is
  if (text.includes('<TITLE_PAGE>') || text.includes('<SECTION')) {
    return text;
  }
  
  // Otherwise, try to clean markdown format
  let cleaned = text;
  
  // Remove ** bold markers
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  
  // Remove --- horizontal rules
  cleaned = cleaned.replace(/^-{3,}$/gm, '');
  
  // Remove ## headers but keep the text
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');
  
  return cleaned;
}

/**
 * Convert parsed coursework back to a formatted string for display/export
 */
export function formatParsedCoursework(parsed: ParsedCoursework): string {
  const lines: string[] = [];
  
  // Title Page
  if (parsed.titlePage.mainTitle) {
    lines.push(parsed.titlePage.mainTitle.toUpperCase());
    lines.push('');
    if (parsed.titlePage.subtitle) {
      lines.push(parsed.titlePage.subtitle);
      lines.push('');
    }
    lines.push('');
    if (parsed.titlePage.studentName) lines.push(`Student: ${parsed.titlePage.studentName}`);
    if (parsed.titlePage.university) lines.push(`University: ${parsed.titlePage.university}`);
    if (parsed.titlePage.course) lines.push(`Course: ${parsed.titlePage.course}`);
    // Always show Lecturer line (blank if not provided for manual filling)
    const lecturerValue = parsed.titlePage.lecturer && !parsed.titlePage.lecturer.includes('_____') 
      ? parsed.titlePage.lecturer 
      : '_________________________';
    lines.push(`Lecturer: ${lecturerValue}`);
    if (parsed.titlePage.date) lines.push(`Date: ${parsed.titlePage.date}`);
    if (parsed.titlePage.wordCount) lines.push(`Word Count: ${parsed.titlePage.wordCount}`);
    lines.push('');
    lines.push('═'.repeat(60));
    lines.push('');
  }
  
  // Abstract
  if (parsed.abstract.content) {
    lines.push('ABSTRACT');
    lines.push('');
    lines.push(parsed.abstract.content);
    if (parsed.abstract.keywords) {
      lines.push('');
      lines.push(`Keywords: ${parsed.abstract.keywords}`);
    }
    lines.push('');
    lines.push('─'.repeat(60));
    lines.push('');
  }
  
  // Sections
  for (const section of parsed.sections) {
    lines.push(`${section.number}. ${section.title.toUpperCase()}`);
    lines.push('');
    
    if (section.subsections.length > 0) {
      for (const sub of section.subsections) {
        lines.push(`${sub.number} ${sub.title}`);
        lines.push('');
        lines.push(sub.content);
        lines.push('');
      }
    } else if (section.content) {
      lines.push(section.content);
      lines.push('');
    }
  }
  
  // References
  if (parsed.references.length > 0) {
    lines.push('─'.repeat(60));
    lines.push('');
    lines.push('REFERENCES');
    lines.push('');
    for (const ref of parsed.references) {
      lines.push(ref);
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * Get word count from parsed coursework (excluding title page and references)
 */
export function getBodyWordCount(parsed: ParsedCoursework): number {
  let totalWords = 0;
  
  // Abstract
  if (parsed.abstract.content) {
    totalWords += parsed.abstract.content.split(/\s+/).filter(w => w.length > 0).length;
  }
  
  // Sections
  for (const section of parsed.sections) {
    if (section.content) {
      totalWords += section.content.split(/\s+/).filter(w => w.length > 0).length;
    }
    for (const sub of section.subsections) {
      totalWords += sub.content.split(/\s+/).filter(w => w.length > 0).length;
    }
  }
  
  return totalWords;
}
