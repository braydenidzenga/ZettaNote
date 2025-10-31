import { useRef, useEffect, useState } from 'react';
import propTypes from 'prop-types';

const NoteEditor = ({
  editorContent,
  handleContentChange,
  handleKeyDown,
  handleContainerClick,
  floatingToolbarEnabled,
  setToolbarVisible,
  setToolbarPos,
}) => {
  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const [lineCount, setLineCount] = useState(20);

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
  }, [editorContent]);

  return (
    <div className="relative">
      {/* Editor Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-sm text-base-content/60 font-medium">Editor Mode</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-base-content/60">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Markdown Enabled
          </span>
          <span>Auto-save: On</span>
          <label className="flex items-center gap-2 cursor-pointer select-none ml-4">
            <input
              type="checkbox"
              checked={floatingToolbarEnabled}
              readOnly
              className="toggle toggle-xs toggle-primary"
            />
            <span className="text-xs font-medium">Floating Toolbar</span>
          </label>
        </div>
      </div>

      {/* Enhanced Editor */}
      <div
        onClick={handleContainerClick}
        onContextMenu={(e) => {
          if (!floatingToolbarEnabled) return;
          e.preventDefault();
          setToolbarPos({ x: e.clientX, y: e.clientY });
          setToolbarVisible(true);
        }}
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
  );
};

NoteEditor.propTypes = {
  editorContent: propTypes.string.isRequired,
  handleContentChange: propTypes.func.isRequired,
  handleKeyDown: propTypes.func.isRequired,
  handleContainerClick: propTypes.func.isRequired,
  floatingToolbarEnabled: propTypes.bool.isRequired,
  setToolbarVisible: propTypes.func.isRequired,
  setToolbarPos: propTypes.func.isRequired,
};

export default NoteEditor;
