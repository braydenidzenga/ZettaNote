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
import propTypes from 'prop-types';

const NoteToolbar = ({
  isPreview,
  setIsPreview,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  wrapSelectedText,
  insertAtCursor,
  handleImageUpload,
  openTableModal,
  editorContent,
}) => {
  const toolbarGroups = [
    {
      name: 'History',
      color: 'primary',
      buttons: [
        {
          icon: FiRotateCcw,
          title: 'Undo (Ctrl+Z)',
          onClick: handleUndo,
          disabled: !canUndo,
          shortcut: 'Ctrl+Z',
        },
        {
          icon: FiRotateCw,
          title: 'Redo (Ctrl+Y)',
          onClick: handleRedo,
          disabled: !canRedo,
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

  return (
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
            <span>{editorContent.split(/\s+/).filter((word) => word.length > 0).length} words</span>
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
  );
};

NoteToolbar.propTypes = {
  isPreview: propTypes.bool.isRequired,
  setIsPreview: propTypes.func.isRequired,
  canUndo: propTypes.bool.isRequired,
  canRedo: propTypes.bool.isRequired,
  handleUndo: propTypes.func.isRequired,
  handleRedo: propTypes.func.isRequired,
  wrapSelectedText: propTypes.func.isRequired,
  insertAtCursor: propTypes.func.isRequired,
  handleImageUpload: propTypes.func.isRequired,
  openTableModal: propTypes.func.isRequired,
  editorContent: propTypes.string.isRequired,
  onSave: propTypes.func,
};

export default NoteToolbar;
