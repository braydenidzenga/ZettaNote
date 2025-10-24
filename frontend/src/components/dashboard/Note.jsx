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
  FiChevronDown,
  FiCopy,
  FiClipboard,
} from 'react-icons/fi';
import { FaQuoteRight, FaListOl, FaStrikethrough, FaHighlighter } from 'react-icons/fa';
import { BiCodeBlock, BiMath } from 'react-icons/bi';
import toast from 'react-hot-toast';
import propTypes from 'prop-types';
import 'highlight.js/styles/atom-one-dark.css';
import { renderMarkdown } from '../../utils/markdownRenderer.js';
import FloatingToolbar from './FloatingToolbar.jsx';

const Note = ({ activePage, onContentChange, content = '', onSave }) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isPreview, setIsPreview] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUpdatingFromHistory, setIsUpdatingFromHistory] = useState(false);
  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const [lineCount, setLineCount] = useState(20);
  // Floating right-click toolbar state
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [enableFloatingToolbar, setEnableFloatingToolbar] = useState(true);

  // Table insertion modal state
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRowsInput, setTableRowsInput] = useState('3');
  const [tableColsInput, setTableColsInput] = useState('3');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeSerial, setIncludeSerial] = useState(true);
  const modalContentRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [headerData, setHeaderData] = useState([]);
  const [tableData, setTableData] = useState([]);

  const lastLoadedPageRef = useRef(null);

  useEffect(() => {
    if (content !== editorContent && !isUpdatingFromHistory) {
      setEditorContent(content);
      // Only reset history when switching to a different page
      if (lastLoadedPageRef.current !== activePage?.id) {
        setHistory([content]);
        setHistoryIndex(0);
        lastLoadedPageRef.current = activePage?.id;
      }
    }
  }, [content, activePage?.id, editorContent, isUpdatingFromHistory]);

  // useEffect(() => { if (isPreview) hljs.highlightAll(); }, [isPreview, editorContent]);

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
        // Remove any history after current index (for when user types after undo)
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newContent);

        // Limit history to 50 entries
        if (newHistory.length > 50) {
          newHistory.shift();
          return newHistory;
        }

        return newHistory;
      });

      setHistoryIndex((prev) => {
        const newIndex = prev + 1;
        // Adjust index if we limited history size
        return history.length >= 50 ? 49 : newIndex;
      });
    },
    [historyIndex, isUpdatingFromHistory, history.length]
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

  // Right-click floating toolbar handlers
  const handleEditorRightClick = (e) => {
    if (!enableFloatingToolbar) return; // allow default context menu when disabled
    e.preventDefault();
    // Keep the current selection by focusing the textarea
    if (editorRef.current) {
      editorRef.current.focus();
    }
    setToolbarPos({ x: e.clientX, y: e.clientY });
    setShowToolbar(true);
  };

  const handleToolbarAction = (action) => {
    switch (action) {
      case 'bold':
        wrapSelectedText('**', '**', 'bold text');
        break;
      case 'italic':
        wrapSelectedText('*', '*', 'italic text');
        break;
      case 'underline':
        wrapSelectedText('<u>', '</u>', 'underlined text');
        break;
      case 'code':
        wrapSelectedText('`', '`', 'code');
        break;
      case 'link':
        wrapSelectedText('[', '](url)', 'Link text');
        break;
      case 'strikethrough':
        wrapSelectedText('~~', '~~', 'strikethrough text');
        break;
      case 'highlight':
        wrapSelectedText('==', '==', 'highlighted text');
        break;
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      case 'h1':
        insertAtCursor('\n# ', 2);
        break;
      case 'h2':
        insertAtCursor('\n## ', 3);
        break;
      case 'h3':
        insertAtCursor('\n### ', 4);
        break;
      case 'blockquote':
        insertAtCursor('\n> ', 2);
        break;
      case 'codeblock':
        insertAtCursor('\n```javascript\n\n```\n', 15);
        break;
      case 'hr':
        insertAtCursor('\n---\n', 1);
        break;
      case 'ul':
        insertAtCursor('\n- ', 2);
        break;
      case 'ol':
        insertAtCursor('\n1. ', 3);
        break;
      case 'task':
        insertAtCursor('\n- [ ] ', 6);
        break;
      case 'deflist':
        insertAtCursor('\nTerm\n: Definition\n', 1);
        break;
      case 'table':
        openTableModal();
        break;
      case 'image':
        handleImageUpload();
        break;
      case 'math':
        wrapSelectedText('$', '$', 'x^2 + y^2 = z^2');
        break;
      case 'copy':
        handleCopy();
        break;
      case 'paste':
        handlePaste();
        break;
      default:
        break;
    }
    setShowToolbar(false);
  };

  const handleCopy = () => {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = editorContent.substring(start, end);
    if (!selected) {
      toast('Nothing selected to copy', { icon: '⚠️' });
      return;
    }
    navigator.clipboard
      .writeText(selected)
      .then(() => toast.success('Copied selection'))
      .catch(() => toast.error('Copy failed'));
  };

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        toast.error('Paste not supported in this context');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast('Clipboard is empty', { icon: 'ℹ️' });
        return;
      }
      insertAtCursor(text, text.length);
    } catch {
      toast.error('Paste failed');
    }
  };

  useEffect(() => {
    if (!showToolbar) return;
    const hide = () => setShowToolbar(false);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [showToolbar]);

  // Table modal: helpers and effects
  const openTableModal = () => {
    setTableRowsInput('3');
    setTableColsInput('3');
    setIncludeHeader(true);
    setIncludeSerial(true);
    const r = 3;
    const c = 3;
    setHeaderData(Array.from({ length: c }, (_, i) => `Header ${i + 1}`));
    setTableData(
      Array.from({ length: r }, (_, ri) =>
        Array.from({ length: c }, (_, ci) => `Cell ${ri * c + ci + 1}`)
      )
    );
    setShowTableModal(true);
  };

  const closeTableModal = () => setShowTableModal(false);

  useEffect(() => {
    if (!showTableModal) return;
    const update = () => {
      const el = modalContentRef.current;
      if (!el) return setShowScrollToBottom(false);
      setShowScrollToBottom(el.scrollHeight > el.clientHeight + 8);
    };
    const t = setTimeout(update, 50);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
    };
  }, [showTableModal, tableRowsInput, tableColsInput, includeHeader, includeSerial]);

  const scrollModalToBottom = () => {
    const el = modalContentRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  // Resize table data structures when inputs change
  useEffect(() => {
    const rows = Math.max(1, Math.min(20, parseInt(tableRowsInput || '1', 10)));
    const cols = Math.max(1, Math.min(20, parseInt(tableColsInput || '1', 10)));
    setHeaderData((prev) => {
      const next = prev ? [...prev] : [];
      for (let i = 0; i < cols; i++) if (next[i] === undefined) next[i] = `Header ${i + 1}`;
      next.length = cols;
      return next;
    });
    setTableData((prev) => {
      const next = prev ? prev.map((r) => [...r]) : [];
      for (let r = 0; r < rows; r++) {
        if (!next[r]) next[r] = Array.from({ length: cols }, (_, c) => `Cell ${r * cols + c + 1}`);
        for (let c = 0; c < cols; c++) if (next[r][c] === undefined) next[r][c] = `Cell ${r * cols + c + 1}`;
        next[r].length = cols;
      }
      next.length = rows;
      return next;
    });
  }, [tableRowsInput, tableColsInput]);

  const confirmInsertTable = () => {
    const rows = parseInt(tableRowsInput, 10);
    const cols = parseInt(tableColsInput, 10);
    if (Number.isNaN(rows) || Number.isNaN(cols) || rows < 1 || cols < 1) {
      toast.error('Invalid table size. Rows and columns must be positive integers.');
      return;
    }
    const MAX = 20;
    const rClamped = Math.max(1, Math.min(MAX, rows));
    const cClamped = Math.max(1, Math.min(MAX, cols));
    const totalCols = (includeSerial ? 1 : 0) + cClamped;
    const headerCells = [];
    if (includeSerial) headerCells.push(includeHeader ? '#' : '');
    for (let i = 0; i < cClamped; i++) {
      const hv = headerData[i];
      headerCells.push(includeHeader ? (hv ?? `Header ${i + 1}`) : '');
    }
    const headerRow = `| ${headerCells.join(' | ')} |`;
    const separatorCells = Array.from({ length: totalCols }, () => '---');
    const separatorRowStr = `| ${separatorCells.join(' | ')} |`;
    const dataRows = [];
    for (let r = 0; r < rClamped; r++) {
      const rowCells = [];
      if (includeSerial) rowCells.push(`${r + 1}`);
      for (let c = 0; c < cClamped; c++) {
        const val = tableData[r] && tableData[r][c] ? tableData[r][c] : `Cell ${r * cClamped + c + 1}`;
        const safeVal = String(val).replace(/\|/g, '\\|');
        rowCells.push(safeVal);
      }
      dataRows.push(`| ${rowCells.join(' | ')} |`);
    }
    const tableMarkdown = `\n${headerRow}\n${separatorRowStr}\n${dataRows.join('\n')}\n`;
    insertAtCursor(tableMarkdown, 1);
    toast.success('Table inserted');
    closeTableModal();
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
          onClick: openTableModal,
        },
        {
          icon: BiMath,
          title: 'Math Formula',
          onClick: () => wrapSelectedText('$', '$', 'x^2 + y^2 = z^2'),
        },
      ],
    },
  ];

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
                          className={`btn btn-ghost btn-xs lg:btn-sm btn-square ${colorClass} hover:scale-105 transition-all duration-200 relative group min-h-0 h-7 lg:h-8 w-7 lg:w-8 ${
                            button.disabled ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                          title={button.title}
                        >
                          <Icon
                            className={`w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 ${
                              button.variant === 'h2'
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
                className={`btn btn-xs lg:btn-sm gap-1 transition-all duration-300 min-h-0 h-7 lg:h-8 ${
                  !isPreview
                    ? 'btn-primary shadow-md shadow-primary/20'
                    : 'btn-ghost hover:btn-primary/20'
                }`}
              >
                <FiEdit className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5" />
                <span className="hidden md:inline text-xs lg:text-sm">Edit</span>
              </button>
              <button
                onClick={() => setIsPreview(true)}
                className={`btn btn-xs lg:btn-sm gap-1 transition-all duration-300 min-h-0 h-7 lg:h-8 ${
                  isPreview
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
                    __html: `${renderMarkdown(editorContent)}`,
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
                  {/* Toggle: enable/disable right-click floating toolbar */}
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs text-base-content/60 hidden sm:inline">Right-click toolbar</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-xs"
                      checked={enableFloatingToolbar}
                      onChange={(e) => setEnableFloatingToolbar(e.target.checked)}
                      aria-label="Toggle right-click floating toolbar"
                    />
                  </div>
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
                  onContextMenu={handleEditorRightClick}
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
      {/* Floating right-click toolbar (using shared component) */}
      <FloatingToolbar
        visible={showToolbar}
        x={toolbarPos.x}
        y={toolbarPos.y}
        onClose={() => setShowToolbar(false)}
      >
        <div className="grid grid-cols-8 gap-1 p-1">
          {/* 24 actions arranged as 3 rows of 8 */}
          <button className="btn btn-ghost btn-xs btn-square" title="Undo" disabled={historyIndex <= 0} onClick={() => handleToolbarAction('undo')}>
            <FiRotateCcw className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Redo" disabled={historyIndex >= history.length - 1} onClick={() => handleToolbarAction('redo')}>
            <FiRotateCw className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Bold" onClick={() => handleToolbarAction('bold')}>
            <FiBold className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Italic" onClick={() => handleToolbarAction('italic')}>
            <FiItalic className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Strikethrough" onClick={() => handleToolbarAction('strikethrough')}>
            <FaStrikethrough className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Underline" onClick={() => handleToolbarAction('underline')}>
            <FiUnderline className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Highlight" onClick={() => handleToolbarAction('highlight')}>
            <FaHighlighter className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Inline Code" onClick={() => handleToolbarAction('code')}>
            <FiCode className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Heading 1" onClick={() => handleToolbarAction('h1')}>
            <FiType className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Heading 2" onClick={() => handleToolbarAction('h2')}>
            <FiType className="w-3.5 h-3.5 opacity-80" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Heading 3" onClick={() => handleToolbarAction('h3')}>
            <FiType className="w-3.5 h-3.5 opacity-60" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Blockquote" onClick={() => handleToolbarAction('blockquote')}>
            <FaQuoteRight className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Code Block" onClick={() => handleToolbarAction('codeblock')}>
            <BiCodeBlock className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Horizontal Rule" onClick={() => handleToolbarAction('hr')}>
            <FiMinus className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Bullet List" onClick={() => handleToolbarAction('ul')}>
            <FiList className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Numbered List" onClick={() => handleToolbarAction('ol')}>
            <FaListOl className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Task List" onClick={() => handleToolbarAction('task')}>
            <FiCheck className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Definition List" onClick={() => handleToolbarAction('deflist')}>
            <FiStar className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Image" onClick={() => handleToolbarAction('image')}>
            <FiImage className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Link" onClick={() => handleToolbarAction('link')}>
            <FiLink className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Insert Table" onClick={() => handleToolbarAction('table')}>
            <FiTable className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Math" onClick={() => handleToolbarAction('math')}>
            <BiMath className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Copy" onClick={() => handleToolbarAction('copy')}>
            <FiCopy className="w-3.5 h-3.5" />
          </button>
          <button className="btn btn-ghost btn-xs btn-square" title="Paste" onClick={() => handleToolbarAction('paste')}>
            <FiClipboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </FloatingToolbar>

      {/* Table insert modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40">
          <div className="bg-base-100 rounded-lg shadow-xl max-w-3xl w-full mx-4 relative flex flex-col max-h-[70vh]">
            <div
              ref={modalContentRef}
              className="p-6 overflow-y-auto no-scrollbar flex-1"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <h3 className="font-bold text-lg">Insert Table</h3>
              <p className="py-2 text-sm text-base-content/70">Specify rows and columns for your table.</p>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col text-sm">
                  Rows (data rows):
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableRowsInput}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9]/g, '');
                      if (v === '') v = '1';
                      let num = Math.max(1, Math.min(20, parseInt(v, 10)));
                      setTableRowsInput(num.toString());
                    }}
                    className="input input-bordered mt-1"
                  />
                </label>
                <label className="flex flex-col text-sm">
                  Columns (data columns):
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableColsInput}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9]/g, '');
                      if (v === '') v = '1';
                      let num = Math.max(1, Math.min(20, parseInt(v, 10)));
                      setTableColsInput(num.toString());
                    }}
                    className="input input-bordered mt-1"
                  />
                </label>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm">Include header row</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeSerial}
                    onChange={(e) => setIncludeSerial(e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm">Include serial column</span>
                </label>
              </div>

              <div className="mt-4">
                <div className="text-sm mb-2">Preview:</div>
                <div className="overflow-auto overflow-x-auto border rounded">
                  <table className="min-w-max table-auto text-sm whitespace-nowrap border border-base-300 border-collapse">
                    <thead>
                      {includeHeader && (
                        <tr>
                          {includeSerial && (
                            <th className="border border-base-300 px-3 py-2 bg-base-200 text-sm font-medium text-base-content">#</th>
                          )}
                          {Array.from({ length: Math.max(1, parseInt(tableColsInput || '1', 10)) }, (_, i) => (
                            <th key={i} className="border border-base-300 px-3 py-2 bg-base-200 text-sm font-medium text-base-content">
                              <input
                                value={headerData[i] ?? `Header ${i + 1}`}
                                onChange={(e) => {
                                  const newHd = [...headerData];
                                  newHd[i] = e.target.value;
                                  setHeaderData(newHd);
                                }}
                                className="bg-transparent border-none p-0 text-sm w-full focus:outline-none"
                              />
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.max(1, parseInt(tableRowsInput || '1', 10)) }, (_, r) => (
                        <tr key={r}>
                          {includeSerial && (
                            <td className="border border-base-300 px-3 py-2 text-sm text-base-content">{r + 1}</td>
                          )}
                          {Array.from({ length: Math.max(1, parseInt(tableColsInput || '1', 10)) }, (_, c) => (
                            <td key={c} className="border border-base-300 px-3 py-2 text-sm">
                              <input
                                value={(tableData[r] && tableData[r][c]) ?? `Cell ${r * Math.max(1, parseInt(tableColsInput || '1', 10)) + c + 1}`}
                                onChange={(e) => {
                                  const newTd = tableData.map((row) => [...row]);
                                  if (!newTd[r]) newTd[r] = [];
                                  newTd[r][c] = e.target.value;
                                  setTableData(newTd);
                                }}
                                className="bg-transparent border-none p-0 text-sm w-full focus:outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-base-100 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={closeTableModal}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmInsertTable}>Insert Table</button>
            </div>

            {showScrollToBottom && (
              <button
                onClick={scrollModalToBottom}
                title="Scroll to actions"
                className="absolute right-4 bottom-16 btn btn-square btn-sm opacity-90"
              >
                <FiChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
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
