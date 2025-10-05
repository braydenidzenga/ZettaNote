import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
    Box, 
    Paper, 
    IconButton, 
    Tooltip, 
    Divider,
    ButtonGroup,
    useTheme,
    Typography,
    Chip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Fade,
    Zoom,
    alpha
} from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    Code,
    FormatListBulleted,
    FormatListNumbered,
    FormatQuote,
    Link as LinkIcon,
    Image as ImageIcon,
    FormatStrikethrough,
    TableChart,
    CheckBox,
    HorizontalRule,
    Title,
    ExpandMore,
    Undo,
    Redo,
    Preview,
    Edit,
    FormatClear
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

const RichMarkdownEditor = ({ 
    content, 
    onChange, 
    placeholder = "Start writing your thoughts...", 
    onBlur,
    height = "70vh",
    showPreview = true 
}) => {
    const theme = useTheme();
    const textareaRef = useRef(null);
    const [isPreviewMode, setIsPreviewMode] = useState(true);
    const [headingMenuAnchor, setHeadingMenuAnchor] = useState(null);
    const [history, setHistory] = useState([content]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [lineCount, setLineCount] = useState(1);

    // Update statistics when content changes
    useEffect(() => {
        const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
        const lines = content.split('\n').length;
        setWordCount(content.trim() ? words : 0);
        setLineCount(lines);
    }, [content]);

    // Auto-focus on mount
    useEffect(() => {
        if (textareaRef.current && !isPreviewMode) {
            textareaRef.current.focus();
        }
    }, [isPreviewMode]);

    // History management
    const addToHistory = useCallback((newContent) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        if (newHistory.length > 50) newHistory.shift(); // Keep max 50 entries
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            onChange(history[newIndex]);
        }
    }, [historyIndex, history, onChange]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            onChange(history[newIndex]);
        }
    }, [historyIndex, history, onChange]);

    const insertMarkdown = useCallback((before, after = '', placeholder = '', newLine = false) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const textToInsert = selectedText || placeholder;
        
        const prefix = newLine && start > 0 && content[start - 1] !== '\n' ? '\n' : '';
        const suffix = newLine ? '\n' : '';
        
        const newText = content.substring(0, start) + prefix + before + textToInsert + after + suffix + content.substring(end);
        onChange(newText);
        addToHistory(newText);

        setTimeout(() => {
            const offsetStart = prefix.length + before.length;
            const offsetEnd = offsetStart + textToInsert.length;
            textarea.setSelectionRange(start + offsetStart, start + offsetEnd);
            textarea.focus();
        }, 0);
    }, [content, onChange, addToHistory]);

    const insertAtCursor = useCallback((text, newLine = false) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        const prefix = newLine && start > 0 && content[start - 1] !== '\n' ? '\n' : '';
        const suffix = newLine ? '\n' : '';
        
        const newText = content.substring(0, start) + prefix + text + suffix + content.substring(end);
        onChange(newText);
        addToHistory(newText);

        setTimeout(() => {
            const newCursorPos = start + prefix.length + text.length + suffix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
        }, 0);
    }, [content, onChange, addToHistory]);

    const handleKeyDown = useCallback((e) => {
        // Tab for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            insertAtCursor('  ');
        }
        
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    insertMarkdown('**', '**', 'bold text');
                    break;
                case 'i':
                    e.preventDefault();
                    insertMarkdown('*', '*', 'italic text');
                    break;
                case 'k':
                    e.preventDefault();
                    insertMarkdown('[', '](url)', 'link text');
                    break;
                case 'e':
                    e.preventDefault();
                    insertMarkdown('`', '`', 'code');
                    break;
                case 'z':
                    if (e.shiftKey) {
                        e.preventDefault();
                        redo();
                    } else {
                        e.preventDefault();
                        undo();
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    setIsPreviewMode(!isPreviewMode);
                    break;
            }
        }
    }, [insertMarkdown, insertAtCursor, undo, redo, isPreviewMode]);

    const handleContentChange = useCallback((e) => {
        onChange(e.target.value);
    }, [onChange]);

    // Toolbar actions
    const actions = {
        bold: () => insertMarkdown('**', '**', 'bold text'),
        italic: () => insertMarkdown('*', '*', 'italic text'),
        strikethrough: () => insertMarkdown('~~', '~~', 'strikethrough'),
        code: () => insertMarkdown('`', '`', 'code'),
        codeBlock: () => insertMarkdown('```\n', '\n```', 'code block', true),
        quote: () => insertMarkdown('> ', '', 'quote', true),
        bulletList: () => insertAtCursor('- ', true),
        numberedList: () => insertAtCursor('1. ', true),
        checkList: () => insertAtCursor('- [ ] ', true),
        link: () => insertMarkdown('[', '](url)', 'link text'),
        image: () => insertMarkdown('![', '](image-url)', 'alt text'),
        table: () => insertMarkdown('\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n', '', '', true),
        hr: () => insertAtCursor('---', true),
    };

    const headingActions = [
        { label: 'Heading 1', action: () => insertMarkdown('# ', '', 'Heading 1', true), level: 1 },
        { label: 'Heading 2', action: () => insertMarkdown('## ', '', 'Heading 2', true), level: 2 },
        { label: 'Heading 3', action: () => insertMarkdown('### ', '', 'Heading 3', true), level: 3 },
        { label: 'Heading 4', action: () => insertMarkdown('#### ', '', 'Heading 4', true), level: 4 },
        { label: 'Heading 5', action: () => insertMarkdown('##### ', '', 'Heading 5', true), level: 5 },
        { label: 'Heading 6', action: () => insertMarkdown('###### ', '', 'Heading 6', true), level: 6 },
    ];

    const handleHeadingClick = (event) => {
        setHeadingMenuAnchor(event.currentTarget);
    };

    const handleHeadingClose = () => {
        setHeadingMenuAnchor(null);
    };

    const handleHeadingSelect = (action) => {
        action();
        handleHeadingClose();
        textareaRef.current?.focus();
    };

    const clearFormatting = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        
        if (selectedText) {
            // Remove common markdown formatting
            const cleanText = selectedText
                .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
                .replace(/\*(.*?)\*/g, '$1') // Italic
                .replace(/~~(.*?)~~/g, '$1') // Strikethrough
                .replace(/`(.*?)`/g, '$1') // Inline code
                .replace(/^#{1,6}\s+/gm, '') // Headers
                .replace(/^>\s+/gm, '') // Quotes
                .replace(/^[-*+]\s+/gm, '') // Lists
                .replace(/^\d+\.\s+/gm, ''); // Numbered lists
            
            const newText = content.substring(0, start) + cleanText + content.substring(end);
            onChange(newText);
            addToHistory(newText);
        }
    };

    return (
        <Box>
            {/* Toolbar */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: '16px 16px 0 0',
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`
                        : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.grey[50], 0.9)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {/* History Controls */}
                    <ButtonGroup size="small" variant="outlined">
                        <Tooltip title="Undo (Ctrl+Z)" arrow>
                            <span>
                                <IconButton 
                                    onClick={undo} 
                                    disabled={historyIndex <= 0}
                                    size="small"
                                >
                                    <Undo fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Redo (Ctrl+Shift+Z)" arrow>
                            <span>
                                <IconButton 
                                    onClick={redo} 
                                    disabled={historyIndex >= history.length - 1}
                                    size="small"
                                >
                                    <Redo fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </ButtonGroup>

                    <Divider orientation="vertical" flexItem />

                    {/* Headings */}
                    <Tooltip title="Headings" arrow>
                        <IconButton onClick={handleHeadingClick} size="small">
                            <Title fontSize="small" />
                            <ExpandMore fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={headingMenuAnchor}
                        open={Boolean(headingMenuAnchor)}
                        onClose={handleHeadingClose}
                        TransitionComponent={Fade}
                    >
                        {headingActions.map((heading) => (
                            <MenuItem key={heading.level} onClick={() => handleHeadingSelect(heading.action)}>
                                <ListItemIcon>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ 
                                            fontSize: `${2.2 - heading.level * 0.2}rem`,
                                            fontWeight: 600,
                                            color: 'text.secondary'
                                        }}
                                    >
                                        H{heading.level}
                                    </Typography>
                                </ListItemIcon>
                                <ListItemText primary={heading.label} />
                            </MenuItem>
                        ))}
                    </Menu>

                    <Divider orientation="vertical" flexItem />

                    {/* Text Formatting */}
                    <ButtonGroup size="small" variant="outlined">
                        <Tooltip title="Bold (Ctrl+B)" arrow>
                            <IconButton onClick={actions.bold} size="small">
                                <FormatBold fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Italic (Ctrl+I)" arrow>
                            <IconButton onClick={actions.italic} size="small">
                                <FormatItalic fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Strikethrough" arrow>
                            <IconButton onClick={actions.strikethrough} size="small">
                                <FormatStrikethrough fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Inline Code (Ctrl+E)" arrow>
                            <IconButton onClick={actions.code} size="small">
                                <Code fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Clear Formatting" arrow>
                            <IconButton onClick={clearFormatting} size="small">
                                <FormatClear fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </ButtonGroup>

                    <Divider orientation="vertical" flexItem />

                    {/* Lists */}
                    <ButtonGroup size="small" variant="outlined">
                        <Tooltip title="Bullet List" arrow>
                            <IconButton onClick={actions.bulletList} size="small">
                                <FormatListBulleted fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Numbered List" arrow>
                            <IconButton onClick={actions.numberedList} size="small">
                                <FormatListNumbered fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Checklist" arrow>
                            <IconButton onClick={actions.checkList} size="small">
                                <CheckBox fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Quote" arrow>
                            <IconButton onClick={actions.quote} size="small">
                                <FormatQuote fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </ButtonGroup>

                    <Divider orientation="vertical" flexItem />

                    {/* Insert Elements */}
                    <ButtonGroup size="small" variant="outlined">
                        <Tooltip title="Link (Ctrl+K)" arrow>
                            <IconButton onClick={actions.link} size="small">
                                <LinkIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Image" arrow>
                            <IconButton onClick={actions.image} size="small">
                                <ImageIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Table" arrow>
                            <IconButton onClick={actions.table} size="small">
                                <TableChart fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Code Block" arrow>
                            <IconButton onClick={actions.codeBlock} size="small">
                                <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '10px' }}>
                                    {'{ }'}
                                </Typography>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Horizontal Rule" arrow>
                            <IconButton onClick={actions.hr} size="small">
                                <HorizontalRule fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </ButtonGroup>

                    {showPreview && (
                        <>
                            <Divider orientation="vertical" flexItem />
                            
                            {/* Preview Toggle */}
                            <Tooltip title={`${isPreviewMode ? 'Edit' : 'Preview'} (Ctrl+Enter)`} arrow>
                                <IconButton 
                                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                                    size="small"
                                    color={isPreviewMode ? 'primary' : 'default'}
                                >
                                    {isPreviewMode ? <Edit fontSize="small" /> : <Preview fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </>
                    )}

                    {/* Statistics */}
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                        <Chip 
                            label={`${wordCount} words`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '11px' }}
                        />
                        <Chip 
                            label={`${lineCount} lines`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: '11px' }}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* Editor/Preview Area */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '0 0 16px 16px',
                    background: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.6)
                        : alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    overflow: 'hidden',
                }}
            >
                {isPreviewMode ? (
                    <Zoom in={isPreviewMode}>
                        <Box
                            sx={{
                                p: 4,
                                minHeight: height,
                                overflow: 'auto',
                                '& h1, & h2, & h3, & h4, & h5, & h6': {
                                    marginTop: 2,
                                    marginBottom: 1,
                                    fontWeight: 600,
                                },
                                '& p': {
                                    marginBottom: 1.5,
                                    lineHeight: 1.7,
                                },
                                '& pre': {
                                    backgroundColor: alpha(theme.palette.grey[500], 0.1),
                                    padding: 2,
                                    borderRadius: 2,
                                    overflow: 'auto',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                },
                                '& code': {
                                    backgroundColor: alpha(theme.palette.grey[500], 0.15),
                                    padding: '2px 6px',
                                    borderRadius: 1,
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace',
                                },
                                '& blockquote': {
                                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                                    paddingLeft: 2,
                                    marginLeft: 0,
                                    marginY: 2,
                                    fontStyle: 'italic',
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    padding: 2,
                                    borderRadius: 1,
                                },
                                '& ul, & ol': {
                                    paddingLeft: 3,
                                    marginBottom: 1.5,
                                },
                                '& table': {
                                    borderCollapse: 'collapse',
                                    width: '100%',
                                    marginY: 2,
                                },
                                '& th, & td': {
                                    border: `1px solid ${theme.palette.divider}`,
                                    padding: 1,
                                    textAlign: 'left',
                                },
                                '& th': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    fontWeight: 600,
                                },
                            }}
                        >
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </Box>
                    </Zoom>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onBlur={onBlur}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        style={{
                            width: '100%',
                            minHeight: height,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: '16px',
                            fontFamily: "'JetBrains Mono', 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace",
                            resize: 'none',
                            padding: '32px',
                            lineHeight: 1.8,
                            color: theme.palette.text.primary,
                            letterSpacing: '0.3px',
                        }}
                    />
                )}
            </Paper>
        </Box>
    );
};

export default RichMarkdownEditor;