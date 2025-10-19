import MarkdownIt from 'markdown-it';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItDeflist from 'markdown-it-deflist';
import hljs from 'highlight.js/lib/core';
import katex from 'katex';
import DOMPurify from 'dompurify';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  highlight: (code, lang) => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch (err) {
      return code;
    }
  },
})
.use(markdownItTaskLists, {
  enabled: true,
  label: false,
  labelAfter: false,
  // Let the plugin handle its own classes
  itemClass: 'task-list-item',
  containerClass: 'contains-task-list'
})
.use(markdownItDeflist);

// custom inline rule for strikethrough (~~text~~)
md.inline.ruler.push('strikethrough', (state) => {
  const start = state.pos;
  const marker = state.src.charCodeAt(start);

  if (marker !== 0x7e) return false; // '~'
  if (state.src.charCodeAt(start + 1) !== marker) return false;

  let pos = start + 2;
  while (pos < state.posMax) {
    if (state.src.charCodeAt(pos) === marker) {
      if (state.src.charCodeAt(pos + 1) === marker) {
        const token = state.push('strikethrough_open', 'del', 1);
        token.markup = '~~';

        state.pos = start + 2;
        const oldPos = state.pos;
        state.pos = pos;

        const content = state.src.slice(oldPos, pos);
        state.push('text', content, 0);

        const closeToken = state.push('strikethrough_close', 'del', -1);
        closeToken.markup = '~~';

        state.pos = pos + 2;
        return true;
      }
    }
    pos++;
  }
  return false;
});

// custom inline rule for highlight (==text==)
md.inline.ruler.push('highlight', (state) => {
  const start = state.pos;
  if (state.src.slice(start, start + 2) !== '==') return false;

  const match = state.src.slice(start).match(/^==([^=]+)==/);
  if (!match) return false;

  const content = match[1];
  const token = state.push('highlight_open', 'mark', 1);
  token.markup = '==';

  state.pos = start + 2;
  state.push('text', '', 0).content = content;

  const closeToken = state.push('highlight_close', 'mark', -1);
  closeToken.markup = '==';

  state.pos = start + match[0].length;
  return true;
});

// Custom renderers for strikethrough and highlight
md.renderer.rules.strikethrough_open = () => '<del class="line-through opacity-75">';
md.renderer.rules.strikethrough_close = () => '</del>';
md.renderer.rules.highlight_open = () => '<mark class="bg-yellow-200 px-1 rounded">';
md.renderer.rules.highlight_close = () => '</mark>';

// custom ruler for inline math ($...$) support using KaTeX 
md.inline.ruler.push('math_inline', (state) => {
  const start = state.pos;
  if (state.src[start] !== '$') return false;
  
  let end = start + 1;
  while (end < state.src.length && state.src[end] !== '$') {
    if (state.src[end] === '\\' && end + 1 < state.src.length) {
      end += 2; // Skip escaped characters
      continue;
    }
    end++;
  }
  
  if (end >= state.src.length) return false;       
  
  const content = state.src.slice(start + 1, end);          
  if (!content.trim()) return false;
  
  try {
    const rendered = katex.renderToString(content, {    // Render the math content using KaTeX
      displayMode: false,
      throwOnError: false
    });
    
    const token = state.push('math_inline', 'span', 0);  // new token for the rendered math
    token.content = rendered;
    
    state.pos = end + 1;
    return true;
  } catch (err) {
    return false;
  }
});

 // Render math inline using the pre-rendered KaTeX HTML
md.renderer.rules.math_inline = (tokens, idx) => tokens[idx].content;

// Apply styling classes to parsed HTML
const addTailwindClasses = (html) => {
  return html
    // Headings
    .replace(/<h1>/g, '<h1 class="text-3xl font-bold mt-8 mb-6">')
    .replace(/<h2>/g, '<h2 class="text-2xl font-bold mt-8 mb-4">')
    .replace(/<h3>/g, '<h3 class="text-xl font-bold mt-6 mb-3">')
    .replace(/<h4>/g, '<h4 class="text-lg font-bold mt-4 mb-2">')
    .replace(/<h5>/g, '<h5 class="font-bold mt-3 mb-2">')
    .replace(/<h6>/g, '<h6 class="font-semibold mt-2 mb-2">')
    // Text formatting
    .replace(/<strong>/g, '<strong class="font-bold text-primary">')
    .replace(/<em>/g, '<em class="italic">')
    // Blockquotes
    .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-primary pl-4 italic my-4 text-base-content/80">')
    // Code blocks with language specified
    .replace(/<code(?! class="[^"]*language-)/g, '<code class="bg-base-200 text-primary px-2 py-1 rounded text-sm font-mono"')
    .replace(/<pre><code class="language-/g, '<pre class="overflow-auto my-4 rounded-lg"><code class="language-')
    // Lists 
    .replace(/<ul>/g, '<ul class="list-disc list-inside my-4 space-y-2">')
    .replace(/<ul class="contains-task-list">/g, '<ul class="list-none pl-4 my-4 space-y-2">')
    .replace(/<ol>/g, '<ol class="list-decimal list-inside my-4 space-y-2">')
    .replace(/<li(?! class="task-list-item)/g, '<li class="text-base-content">')
    // Tables
    .replace(/<table>/g, '<table class="border-collapse border border-base-300 w-full my-4">')
    .replace(/<thead>/g, '<thead class="bg-base-100">')
    .replace(/<th>/g, '<th class="border border-base-300 px-3 py-2 font-semibold text-left">')
    .replace(/<td>/g, '<td class="border border-base-300 px-3 py-2">')
    // Paragraphs
    .replace(/<p>/g, '<p class="mb-4 leading-relaxed">')
    // Links
    .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-medium" ')
    // Images
    .replace(/<img /g, '<img class="max-w-full h-auto rounded-lg shadow-md my-4" ')
    // Horizontal rule
    .replace(/<hr\s*\/?>/g, '<hr class="border-base-300 my-8">')
    // Task list checkboxes
    .replace(/<input\s+type="checkbox"/g, '<input type="checkbox" class="checkbox checkbox-primary checkbox-sm" onclick="this.checked=!this.checked"')
    // Definition list html tags and styles
    .replace(/<dl>/g, '<dl class="my-4 space-y-4">')
    .replace(/<dt>/g, '<dt class="font-bold text-lg text-primary">')
    .replace(/<dd>/g, '<dd class="ml-4 mt-1 text-base-content/90">');
};

export const renderMarkdown = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const html = md.render(text);
  
//  // Log the raw HTML before style application
//   console.group('Markdown Renderer Debug');
//   console.log('Original Text:', text);
//   console.log('Raw HTML before styling:', html);
  
  const styledHtml = addTailwindClasses(html);
  // console.log('Styled HTML before sanitization:', styledHtml);
  
  // Sanitize the HTML with DOMPurify - allow necessary attributes and tags
  const sanitizedHtml = DOMPurify.sanitize(styledHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['class', 'target', 'disabled', 'checked', 'type'],
    ADD_TAGS: ['input', 'mark']  // Allow input for checkboxes and mark for highlights
  });
  
  // console.log('Final sanitized HTML:', sanitizedHtml);
  // console.groupEnd();
  
  return sanitizedHtml;
};