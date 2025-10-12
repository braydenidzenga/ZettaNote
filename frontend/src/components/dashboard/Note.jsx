import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiImage,
  FiList,
  FiCheck,
  FiLink,
  FiTable,
  FiType,
  FiRotateCcw,
  FiRotateCw,
  FiEye,
  FiEdit,
  FiCode,
  FiMinus,
  FiStar,
} from 'react-icons/fi';
import { FaQuoteRight, FaListOl, FaStrikethrough, FaHighlighter } from 'react-icons/fa';
import { BiCodeBlock, BiMath } from 'react-icons/bi';
import toast from 'react-hot-toast';
import propTypes from 'prop-types';

// Importing highlight.js for code syntax highlighting
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

const Note = ({ activePage, onContentChange, content = '', onSave }) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isPreview, setIsPreview] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUpdatingFromHistory, setIsUpdatingFromHistory] = useState(false);
  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const [lineCount, setLineCount] = useState(20);

  useEffect(() => {
    if (content !== editorContent) {
      setEditorContent(content);
      setHistory([content]);
      setHistoryIndex(0);
    }
  }, [content, activePage?.id, editorContent]);

  // Auto-resize textarea to match content so the outer container remains the single scroller
  useEffect(() => {
    const ta = editorRef.current;
    if (!ta) return;
    // Reset height to allow shrink when content is reduced
    ta.style.height = 'auto';
    // Set height to the scrollHeight so the textarea grows with content
    ta.style.height = `${ta.scrollHeight}px`;
    // Also sync the line numbers container height to match textarea for visual alignment
    const ln = lineNumbersRef.current;
    if (ln) {
      ln.style.minHeight = `${ta.scrollHeight}px`;
    }
    // Compute how many line number rows are needed based on textarea's rendered height
    const approxLineHeight = 24; // px - matches the visual line height (h-6 ~ 24px)
    const requiredLines = Math.max(1, Math.floor(ta.scrollHeight / approxLineHeight));
    setLineCount(requiredLines);
  }, [editorContent, activePage?.id]);

  const addToHistory = useCallback(
    (newContent) => {
      if (isUpdatingFromHistory) return;

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        if (newHistory.length > 50) {
          newHistory.shift();
          setHistoryIndex(newHistory.length - 1);
          return newHistory;
        }
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [historyIndex, isUpdatingFromHistory]
  );

  // Clicking the outer editor container's empty space should move the cursor there.
  const handleContainerClick = (e) => {
    // Only handle clicks directly on the container (not children like textarea)
    if (e.target !== e.currentTarget) return;

    const ta = editorRef.current;
    if (!ta) return;

    // Append a couple of newlines to create an empty area and place cursor at end
    const appended = '\n\n';
    const newContent = `${editorContent}${appended}`;
    setEditorContent(newContent);
    addToHistory(newContent);
    if (onContentChange) onContentChange(newContent);

    // Focus and move caret to end after DOM updates
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newContent.length, newContent.length);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
          break;
        case 'y':
          e.preventDefault();
          handleRedo();
          break;
        case 'b':
          e.preventDefault();
          wrapSelectedText('**', '**', 'bold text');
          break;
        case 'i':
          e.preventDefault();
          wrapSelectedText('*', '*', 'italic text');
          break;
        case 's':
          e.preventDefault();
          if (onSave) {
            onSave();
            toast.success('Note saved!');
          }
          break;
        default:
          break;
      }
    }
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setEditorContent(newContent);

    addToHistory(newContent);

    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const insertAtCursor = (text, moveCursor = text.length) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = editorContent;

    const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
    setEditorContent(newContent);
    addToHistory(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + moveCursor, start + moveCursor);
    }, 0);

    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const wrapSelectedText = (prefix, suffix = prefix, placeholder = 'text') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editorContent.substring(start, end);
    const currentContent = editorContent;

    if (selectedText) {
      const wrappedText = prefix + selectedText + suffix;
      const newContent =
        currentContent.substring(0, start) + wrappedText + currentContent.substring(end);
      setEditorContent(newContent);
      addToHistory(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selectedText.length
        );
      }, 0);
    } else {
      const wrappedText = prefix + placeholder + suffix;
      const newContent =
        currentContent.substring(0, start) + wrappedText + currentContent.substring(end);
      setEditorContent(newContent);
      addToHistory(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + placeholder.length
        );
      }, 0);
    }

    if (onContentChange) {
      const finalContent = selectedText
        ? currentContent.substring(0, start) +
        prefix +
        selectedText +
        suffix +
        currentContent.substring(end)
        : currentContent.substring(0, start) +
        prefix +
        placeholder +
        suffix +
        currentContent.substring(end);
      onContentChange(finalContent);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUpdatingFromHistory(true);
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousContent = history[newIndex];
      setEditorContent(previousContent);

      if (onContentChange) {
        onContentChange(previousContent);
      }

      setTimeout(() => setIsUpdatingFromHistory(false), 0);
      toast.success('Undone');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUpdatingFromHistory(true);
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextContent = history[newIndex];
      setEditorContent(nextContent);

      if (onContentChange) {
        onContentChange(nextContent);
      }

      setTimeout(() => setIsUpdatingFromHistory(false), 0);
      toast.success('Redone');
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const imageMarkdown = `![${file.name}](url-placeholder-${file.name})`;
        insertAtCursor(imageMarkdown);
        toast.info('Image upload functionality would be implemented here');
      }
    };
    input.click();
  };

  const toolbarGroups = [
    {
      name: 'History',
      color: 'primary',
      buttons: [
        {
          icon: FiRotateCcw,
          title: 'Undo (Ctrl+Z)',
          onClick: handleUndo,
          disabled: historyIndex <= 0,
          shortcut: 'Ctrl+Z',
        },
        {
          icon: FiRotateCw,
          title: 'Redo (Ctrl+Y)',
          onClick: handleRedo,
          disabled: historyIndex >= history.length - 1,
          shortcut: 'Ctrl+Y',
        },
      ],
    },
    {
      name: 'Format',
      color: 'secondary',
      buttons: [
        {
          icon: FiBold,
          title: 'Bold (Ctrl+B)',
          onClick: () => wrapSelectedText('**', '**', 'bold text'),
          shortcut: 'Ctrl+B',
        },
        {
          icon: FiItalic,
          title: 'Italic (Ctrl+I)',
          onClick: () => wrapSelectedText('*', '*', 'italic text'),
          shortcut: 'Ctrl+I',
        },
        {
          icon: FaStrikethrough,
          title: 'Strikethrough',
          onClick: () => wrapSelectedText('~~', '~~', 'strikethrough text'),
        },
        {
          icon: FiUnderline,
          title: 'Underline',
          onClick: () => wrapSelectedText('<u>', '</u>', 'underlined text'),
        },
        {
          icon: FaHighlighter,
          title: 'Highlight',
          onClick: () => wrapSelectedText('==', '==', 'highlighted text'),
        },
        {
          icon: FiCode,
          title: 'Inline Code',
          onClick: () => wrapSelectedText('`', '`', 'code'),
        },
      ],
    },
    {
      name: 'Structure',
      color: 'accent',
      buttons: [
        {
          icon: FiType,
          title: 'Heading 1',
          onClick: () => insertAtCursor('\n# ', 2),
        },
        {
          icon: FiType,
          title: 'Heading 2',
          onClick: () => insertAtCursor('\n## ', 3),
          variant: 'h2',
        },
        {
          icon: FiType,
          title: 'Heading 3',
          onClick: () => insertAtCursor('\n### ', 4),
          variant: 'h3',
        },
        {
          icon: FaQuoteRight,
          title: 'Blockquote',
          onClick: () => insertAtCursor('\n> ', 2),
        },
        {
          icon: BiCodeBlock,
          title: 'Code Block',
          onClick: () => insertAtCursor('\n```javascript\n\n```\n', 15),
        },
        {
          icon: FiMinus,
          title: 'Horizontal Rule',
          onClick: () => insertAtCursor('\n---\n', 1),
        },
      ],
    },
    {
      name: 'Lists',
      color: 'success',
      buttons: [
        {
          icon: FiList,
          title: 'Bullet List',
          onClick: () => insertAtCursor('\n- ', 2),
        },
        {
          icon: FaListOl,
          title: 'Numbered List',
          onClick: () => insertAtCursor('\n1. ', 3),
        },
        {
          icon: FiCheck,
          title: 'Task List',
          onClick: () => insertAtCursor('\n- [ ] ', 6),
        },
        {
          icon: FiStar,
          title: 'Definition List',
          onClick: () => insertAtCursor('\nTerm\n: Definition\n', 1),
        },
      ],
    },
    {
      name: 'Media',
      color: 'warning',
      buttons: [
        {
          icon: FiImage,
          title: 'Add Image',
          onClick: handleImageUpload,
        },
        {
          icon: FiLink,
          title: 'Add Link',
          onClick: () => wrapSelectedText('[', '](url)', 'Link text'),
        },
        {
          icon: FiTable,
          title: 'Add Table',
          onClick: () =>
            insertAtCursor(
              '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n',
              1
            ),
        },
        {
          icon: BiMath,
          title: 'Math Formula',
          onClick: () => wrapSelectedText('$', '$', 'x^2 + y^2 = z^2'),
        },
      ],
    },
  ];

  const renderMarkdown = (text) => {
    return text
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-6">$1</h1>')

      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-primary">$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')
      .replace(/~~(.*?)~~/g, '<del class="line-through opacity-75">$1</del>')
      .replace(/==(.*?)==/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
      .replace(/<u>(.*?)<\/u>/g, '<u class="underline">$1</u>')
      // Code
      // Multiline code block with syntax highlighting
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const highlighted = lang
          ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
          : hljs.highlightAuto(code).value;

        console.log("Code block language:", lang || hljs.highlightAuto(code).language);

        return `<pre class="bg-base-200 p-4 rounded-lg overflow-auto my-4"><code class="text-sm font-mono language-${lang || 'auto'}">${highlighted}</code></pre>`;
      })
      // Single line code block with syntax highlighting
      //tbh idk why adding highlighting just to multiline code block adds it to single line too, but i will add it again just to be safe.
      .replace(/`([^`]+)`/g, (match, code) => {
        const highlighted = hljs.highlightAuto(code).value;
        console.log("Inline code language:", hljs.highlightAuto(code).language);
        return `<code class="bg-base-200 text-primary px-2 py-1 rounded text-sm font-mono">${highlighted}</code>`;
      })

      .replace(
        /^> (.*$)/gm,
        '<blockquote class="border-l-4 border-primary pl-4 italic my-4 text-base-content/80">$1</blockquote>'
      )
      .replace(
        /^- \[x\] (.*$)/gm,
        '<li class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="checkbox checkbox-primary checkbox-sm"> <span class="line-through opacity-75">$1</span></li>'
      )
      .replace(
        /^- \[ \] (.*$)/gm,
        '<li class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="checkbox checkbox-sm"> $1</li>'
      )
      .replace(
        /^- (.*$)/gm,
        '<li class="flex items-start gap-2 my-1"><span class="text-primary">•</span> $1</li>'
      )
      .replace(/^\d+\. (.*$)/gm, '<li class="flex items-start gap-2 my-1 ml-4">$1</li>')

      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" class="text-primary hover:underline font-medium">$1</a>'
      )
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-md my-4">'
      )

      .replace(/^---$/gm, '<hr class="border-base-300 my-8">')

      .replace(
        /\$\$(.*?)\$\$/g,
        '<div class="bg-base-200 p-4 rounded-lg text-center font-mono my-4">$1</div>'
      )
      .replace(
        /\$([^$]+)\$/g,
        '<span class="bg-base-200 px-2 py-1 rounded font-mono text-sm">$1</span>'
      )
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match
          .slice(1, -1)
          .split('|')
          .map((cell) => cell.trim());
        return (
          '<tr>' +
          cells
            .map((cell) => `<td class="border border-base-300 px-3 py-2">${cell}</td>`)
            .join('') +
          '</tr>'
        );
      })

      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  if (!activePage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base-100">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-primary/20 rounded-3xl flex items-center justify-center shadow-lg border border-primary/10">
              <FiEdit className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-primary">Ready to Create?</h3>
            <p className="text-base-content/70 text-lg leading-relaxed">
              Select a page from the sidebar or create a new one to start your creative journey
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-base-100">
      {/* Enhanced Toolbar */}
      <div className="border-b border-base-300/60 bg-base-100/80 backdrop-blur-xl sticky top-28 lg:top-32 z-20 shadow-sm">
        <div className="p-2 lg:p-4">
          <div className="flex items-center justify-between mb-2 lg:mb-4 gap-2">
            {/* Enhanced Toolbar Groups */}
            <div className="flex items-center gap-0.5 lg:gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
              {toolbarGroups.map((group, groupIndex) => (
                <div
                  key={group.name}
                  className="flex items-center bg-base-200/30 rounded-md lg:rounded-lg p-0.5 border border-base-300/20 flex-shrink-0"
                  title={group.name}
                >
                  {group.buttons
                    .slice(
                      0,
                      window.innerWidth < 1024 && groupIndex > 2
                        ? 1
                        : window.innerWidth < 768 && groupIndex > 1
                          ? 2
                          : group.buttons.length
                    )
                    .map((button, buttonIndex) => {
                      const Icon = button.icon;
                      const colorClass = `hover:btn-${group.color}`;

                      return (
                        <button
                          key={buttonIndex}
                          onClick={button.onClick}
                          disabled={button.disabled}
                          className={`btn btn-ghost btn-xs lg:btn-sm btn-square ${colorClass} hover:scale-105 transition-all duration-200 relative group min-h-0 h-7 lg:h-8 w-7 lg:w-8 ${button.disabled ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          title={button.title}
                        >
                          <Icon
                            className={`w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 ${button.variant === 'h2'
                                ? 'scale-90'
                                : button.variant === 'h3'
                                  ? 'scale-75'
                                  : ''
                              }`}
                          />

                          {/* Tooltip with shortcut */}
                          {button.shortcut && (
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-base-content text-base-100 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              {button.shortcut}
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>

            {/* Enhanced Preview Toggle */}
            <div className="flex items-center gap-5 bg-base-200/30 rounded-md lg:rounded-lg p-0.5 border border-base-300/20 flex-shrink-0">
              <button
                onClick={() => setIsPreview(false)}
                className={`btn btn-xs lg:btn-sm gap-1 transition-all duration-300 min-h-0 h-7 lg:h-8 ${!isPreview
                    ? 'btn-primary shadow-md shadow-primary/20'
                    : 'btn-ghost hover:btn-primary/20'
                  }`}
              >
                <FiEdit className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5" />
                <span className="hidden md:inline text-xs lg:text-sm">Edit</span>
              </button>
              <button
                onClick={() => setIsPreview(true)}
                className={`btn btn-xs lg:btn-sm gap-1 transition-all duration-300 min-h-0 h-7 lg:h-8 ${isPreview
                    ? 'btn-primary shadow-md shadow-primary/20'
                    : 'btn-ghost hover:btn-primary/20'
                  }`}
              >
                <FiEye className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5" />
                <span className="hidden md:inline text-xs lg:text-sm">Preview</span>
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs text-base-content/60">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                {isPreview ? 'Preview Mode' : 'Edit Mode'}
              </span>
              <span>{editorContent.length} characters</span>
              <span>
                {editorContent.split(/\s+/).filter((word) => word.length > 0).length} words
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Press</span>
              <kbd className="kbd kbd-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="kbd kbd-xs">S</kbd>
              <span>to save</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Editor/Preview Area */}
      <div className="flex-1 p-2 lg:p-6">
        <div className="max-w-5xl mx-auto">
          {isPreview ? (
            <div className="relative">
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm text-base-content/60 font-medium">Preview Mode</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-base-content/60">
                  <FiEye className="w-4 h-4" />
                  <span>Live Preview</span>
                </div>
              </div>

              {/* Enhanced Preview Content */}
              <div className="bg-base-100 rounded-2xl border border-base-300 shadow-lg overflow-hidden">
                <div
                  className="max-w-none p-4 lg:p-8 xl:p-12 min-h-[24rem] lg:min-h-[32rem] leading-relaxed text-sm lg:text-base"
                  dangerouslySetInnerHTML={{
                    __html: `<p class="mb-4">${renderMarkdown(editorContent)}</p>`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Editor Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-sm text-base-content/60 font-medium">Editor Mode</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-base-content/60">
                  <span className="flex items-center gap-1">
                    <FiEdit className="w-4 h-4" />
                    Markdown Enabled
                  </span>
                  <span>Auto-save: On</span>
                </div>
              </div>

              {/* Enhanced Editor */}
              <div
                onClick={handleContainerClick}
                className="bg-base-100 rounded-2xl border border-base-300 shadow-lg overflow-x-hidden overflow-y-auto max-h-[70vh] min-h-[70vh] relative flex note-container-scrollable"
              >
                {/* Line Numbers */}
                <div
                  ref={lineNumbersRef}
                  className="hidden lg:flex flex-col w-16 bg-base-200/30 border-r border-base-300/50 py-4 text-xs text-base-content/40 font-mono flex-shrink-0"
                >
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div
                      key={i + 1}
                      className="px-2 h-6 flex items-center justify-end"
                      style={{ lineHeight: '1.6' }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <textarea
                  ref={editorRef}
                  value={editorContent}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  placeholder="# Welcome to your note! ✨

Start writing here... You can use Markdown for rich formatting:

**Bold text** for emphasis
*Italic text* for style  
~~Strikethrough~~ for deletion
==Highlight== for important parts
`inline code` for snippets
- Bullet points for lists
> Quotes for inspiration
- [ ] Task lists for todos

Press Ctrl+B for bold, Ctrl+I for italic, Ctrl+Z for undo!
Happy writing! 🚀"
                  className="flex-1 px-4 lg:px-6 py-4 lg:py-6 bg-transparent border-none resize-none focus:outline-none text-sm lg:text-base leading-relaxed placeholder:text-base-content/40 placeholder:leading-relaxed note-editor-textarea"
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    lineHeight: '1.6',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Note.propTypes = {
  activePage: propTypes.object,
  onContentChange: propTypes.func,
  content: propTypes.string,
  onSave: propTypes.func,
};

export default Note;
