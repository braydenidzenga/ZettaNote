import { useState, useRef, useEffect } from 'react';
import FloatingToolbar from './FloatingToolbar';
import NoteToolbar from './NoteToolbar';
import NoteEditor from './NoteEditor';
import NotePreview from './NotePreview';
import TableModal from './TableModal';
import {
  FiEdit,
  FiBold,
  FiItalic,
  FiUnderline,
  FiImage,
  FiList,
  FiCheck,
  FiLink,
  FiTable,
  FiType,
  FiCode,
  FiMinus,
  FiStar,
  FiCopy,
  FiClipboard,
} from 'react-icons/fi';
import { FaQuoteRight, FaListOl, FaStrikethrough, FaHighlighter } from 'react-icons/fa';
import { BiCodeBlock, BiMath } from 'react-icons/bi';
import toast from 'react-hot-toast';
import propTypes from 'prop-types';
import { useHistory } from '../../hooks/useHistory';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useTableModal } from '../../hooks/useTableModal';

// =============================================================================
// DEVELOPER NOTES
// =============================================================================
// Note component - Main markdown editor with live preview.
// Key features:
// - Real-time markdown rendering and preview
// - Undo/redo functionality with history management
// - Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+Z, etc.)
// - Auto-resizing textarea with line numbers
// - Rich toolbar with formatting options
// - Syntax highlighting in preview mode
//
// Performance considerations:
// - Debounced content updates to parent
// - Efficient history management (limited to 50 entries)
// - Optimized re-renders with proper useEffect dependencies

// =============================================================================
// TODO
// =============================================================================
// - [ ] Add collaborative editing with real-time cursors
// - [ ] Implement image upload and embedding
// - [ ] Add table editing capabilities
// - [ ] Implement spell checking
// - [ ] Add find and replace functionality
// - [ ] Support for custom markdown extensions
// - [ ] Add export to PDF/HTML functionality
// - [ ] Implement dark mode syntax highlighting themes
// - [ ] Add voice-to-text input support

const Note = ({ activePage, onContentChange, content = '', onSave }) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isPreview, setIsPreview] = useState(false);
  // Floating toolbar state
  const [floatingToolbarEnabled] = useState(true);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const editorRef = useRef(null);

  // Use custom hooks
  const { addToHistory, handleUndo, handleRedo, resetHistory, canUndo, canRedo } = useHistory(
    content,
    onContentChange
  );
  const { handleImageUpload } = useImageUpload(
    activePage,
    editorContent,
    (newContent) => {
      setEditorContent(newContent);
      onContentChange?.(newContent);
    },
    addToHistory
  );
  const {
    showTableModal,
    tableRowsInput,
    setTableRowsInput,
    tableColsInput,
    setTableColsInput,
    includeHeader,
    setIncludeHeader,
    includeSerial,
    setIncludeSerial,
    headerData,
    setHeaderData,
    tableData,
    setTableData,
    openTableModal,
    closeTableModal,
    confirmInsertTable,
  } = useTableModal((text, moveCursor) => insertAtCursor(text, moveCursor));

  useEffect(() => {
    // Only update editor content when switching to a different page
    // Never update while on the same page to prevent interrupting user input
    const currentPageId = editorRef.current?.dataset.pageId;
    const newPageId = activePage?.id;

    if (newPageId && currentPageId !== newPageId) {
      // Switching to a different page - load the new content
      setEditorContent(content);
      resetHistory(content, newPageId);
      if (editorRef.current) {
        editorRef.current.dataset.pageId = newPageId;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage?.id]); // Only depend on page ID, not content or editorContent

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
    } else if (e.key === 'Enter') {
      // Handle list continuation
      const textarea = editorRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const text = editorContent;

      // Find the start of the current line
      let lineStart = cursorPos;
      while (lineStart > 0 && text[lineStart - 1] !== '\n') {
        lineStart--;
      }

      // Get the current line
      let lineEnd = cursorPos;
      while (lineEnd < text.length && text[lineEnd] !== '\n') {
        lineEnd++;
      }
      const currentLine = text.substring(lineStart, lineEnd);

      // Check for list patterns
      const bulletMatch = currentLine.match(/^(\s*)-(\s*.*)?$/);
      const numberedMatch = currentLine.match(/^(\s*)(\d+)\.(\s*.*)?$/);
      const taskMatch = currentLine.match(/^(\s*)-(\s*)\[([ x])\](\s*.*)?$/);

      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const hasContent = bulletMatch[2] && bulletMatch[2].trim();
        if (hasContent) {
          // Continue bullet list
          insertAtCursor(`\n${indent}- `, 2);
        } else {
          // Exit list - insert newline with space
          insertAtCursor('\n ', 1);
        }
      } else if (numberedMatch) {
        e.preventDefault();
        const indent = numberedMatch[1];
        const number = parseInt(numberedMatch[2], 10);
        const hasContent = numberedMatch[3] && numberedMatch[3].trim();
        if (hasContent) {
          // Continue numbered list with next number
          insertAtCursor(`\n${indent}${number + 1}. `, 3);
        } else {
          // Exit list
          insertAtCursor('\n ', 1);
        }
      } else if (taskMatch) {
        e.preventDefault();
        const indent = taskMatch[1];
        const hasContent = taskMatch[4] && taskMatch[4].trim();
        if (hasContent) {
          // Continue task list
          insertAtCursor(`\n${indent}- [ ] `, 6);
        } else {
          // Exit list
          insertAtCursor('\n ', 1);
        }
      }
      // If not a list, let default behavior happen
    }
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
      {/* Floating Toolbar for right-click */}
      <FloatingToolbar
        visible={toolbarVisible}
        x={toolbarPos.x}
        y={toolbarPos.y}
        onClose={() => setToolbarVisible(false)}
      >
        {(() => {
          const allButtons = [
            {
              icon: FiBold,
              title: 'Bold',
              onClick: () => wrapSelectedText('**', '**', 'bold text'),
            },
            {
              icon: FiItalic,
              title: 'Italic',
              onClick: () => wrapSelectedText('*', '*', 'italic text'),
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
            { icon: FiType, title: 'Heading 1', onClick: () => insertAtCursor('\n# ', 2) },
            { icon: FiType, title: 'Heading 2', onClick: () => insertAtCursor('\n## ', 3) },
            { icon: FiType, title: 'Heading 3', onClick: () => insertAtCursor('\n### ', 4) },
            { icon: FaQuoteRight, title: 'Blockquote', onClick: () => insertAtCursor('\n> ', 2) },
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
            { icon: FiList, title: 'Bullet List', onClick: () => insertAtCursor('\n- ', 2) },
            { icon: FaListOl, title: 'Numbered List', onClick: () => insertAtCursor('\n1. ', 3) },
            { icon: FiCheck, title: 'Task List', onClick: () => insertAtCursor('\n- [ ] ', 6) },
            {
              icon: FiStar,
              title: 'Definition List',
              onClick: () => insertAtCursor('\nTerm\n: Definition\n', 1),
            },
            { icon: FiImage, title: 'Add Image', onClick: handleImageUpload },
            {
              icon: FiLink,
              title: 'Add Link',
              onClick: () => wrapSelectedText('[', '](url)', 'Link text'),
            },
            { icon: FiTable, title: 'Add Table', onClick: openTableModal },
            {
              icon: BiMath,
              title: 'Math Formula',
              onClick: () => wrapSelectedText('$', '$', 'x^2 + y^2 = z^2'),
            },
          ];
          const rows = [allButtons.slice(0, 8), allButtons.slice(8, 16), allButtons.slice(16, 22)];
          // Add Copy and Paste buttons to the last row
          const copyPasteIcons = [
            {
              title: 'Copy',
              icon: FiCopy,
              onClick: async () => {
                try {
                  const textarea = editorRef.current;
                  let textToCopy = editorContent;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    if (start !== end) {
                      textToCopy = editorContent.substring(start, end);
                    }
                  }
                  await navigator.clipboard.writeText(textToCopy);
                  toast.success('Copied to clipboard');
                } catch {
                  toast.error('Copy failed');
                }
                setToolbarVisible(false);
              },
            },
            {
              title: 'Paste',
              icon: FiClipboard,
              onClick: async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  insertAtCursor(text);
                  toast.success('Pasted from clipboard');
                } catch {
                  toast.error('Paste failed');
                }
                setToolbarVisible(false);
              },
            },
          ];
          const thirdRow = [...rows[2], ...copyPasteIcons];
          return (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 justify-center">
                {rows[0].map((btn, idx) => (
                  <button
                    key={btn.title + '-' + idx}
                    className={`btn btn-square btn-sm flex items-center justify-center ${
                      btn.icon === FiTable ? 'btn-primary' : 'btn-ghost'
                    }`}
                    title={btn.title}
                    onClick={() => {
                      setToolbarVisible(false);
                      btn.onClick();
                    }}
                    disabled={btn.disabled}
                    style={{ minWidth: 36, minHeight: 36 }}
                  >
                    {btn.icon && <btn.icon className="w-5 h-5" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-center">
                {rows[1].map((btn, idx) => (
                  <button
                    key={btn.title + '-' + idx}
                    className={`btn btn-square btn-sm flex items-center justify-center ${
                      btn.icon === FiTable ? 'btn-primary' : 'btn-ghost'
                    }`}
                    title={btn.title}
                    onClick={() => {
                      setToolbarVisible(false);
                      btn.onClick();
                    }}
                    disabled={btn.disabled}
                    style={{ minWidth: 36, minHeight: 36 }}
                  >
                    {btn.icon && <btn.icon className="w-5 h-5" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-center">
                {thirdRow.map((btn, idx) => (
                  <button
                    key={btn.title + '-' + idx}
                    className={`btn btn-square btn-sm flex items-center justify-center ${
                      btn.icon === FiTable ? 'btn-primary' : 'btn-ghost'
                    }`}
                    title={btn.title}
                    onClick={btn.onClick}
                    style={{ minWidth: 36, minHeight: 36 }}
                  >
                    {btn.icon && <btn.icon className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </FloatingToolbar>

      <NoteToolbar
        isPreview={isPreview}
        setIsPreview={setIsPreview}
        canUndo={canUndo}
        canRedo={canRedo}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        wrapSelectedText={wrapSelectedText}
        insertAtCursor={insertAtCursor}
        handleImageUpload={handleImageUpload}
        openTableModal={openTableModal}
        editorContent={editorContent}
        onSave={onSave}
      />

      {/* Enhanced Editor/Preview Area */}
      <div className="flex-1 p-2 lg:p-6">
        <div className="max-w-5xl mx-auto">
          {isPreview ? (
            <NotePreview editorContent={editorContent} />
          ) : (
            <NoteEditor
              editorContent={editorContent}
              handleContentChange={handleContentChange}
              handleKeyDown={handleKeyDown}
              handleContainerClick={handleContainerClick}
              floatingToolbarEnabled={floatingToolbarEnabled}
              setToolbarVisible={setToolbarVisible}
              setToolbarPos={setToolbarPos}
            />
          )}
        </div>
      </div>

      <TableModal
        showTableModal={showTableModal}
        tableRowsInput={tableRowsInput}
        setTableRowsInput={setTableRowsInput}
        tableColsInput={tableColsInput}
        setTableColsInput={setTableColsInput}
        includeHeader={includeHeader}
        setIncludeHeader={setIncludeHeader}
        includeSerial={includeSerial}
        setIncludeSerial={setIncludeSerial}
        headerData={headerData}
        setHeaderData={setHeaderData}
        tableData={tableData}
        setTableData={setTableData}
        closeTableModal={closeTableModal}
        confirmInsertTable={confirmInsertTable}
      />
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
