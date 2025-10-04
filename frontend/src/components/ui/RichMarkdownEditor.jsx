import React, { useRef, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    IconButton, 
    Tooltip, 
    Divider,
    ButtonGroup,
    useTheme,
    Typography
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
    HorizontalRule
} from '@mui/icons-material';

const RichMarkdownEditor = ({ content, onChange, placeholder = "Start writing your thoughts...", onBlur }) => {
    const theme = useTheme();
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const insertMarkdown = (before, after = '', placeholder = '', newLine = false) => {
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

        setTimeout(() => {
            const offsetStart = prefix.length + before.length;
            const offsetEnd = offsetStart + textToInsert.length;
            textarea.setSelectionRange(start + offsetStart, start + offsetEnd);
            textarea.focus();
        }, 0);
    };

    const insertAtCursor = (text, newLine = false) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        const prefix = newLine && start > 0 && content[start - 1] !== '\n' ? '\n' : '';
        const suffix = newLine ? '\n' : '';
        
        const newText = content.substring(0, start) + prefix + text + suffix + content.substring(end);
        onChange(newText);

        setTimeout(() => {
            const newCursorPos = start + prefix.length + text.length + suffix.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            insertAtCursor('  ');
        }
        
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            insertMarkdown('**', '**', 'bold text');
        }
        
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            insertMarkdown('*', '*', 'italic text');
        }
        
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            insertMarkdown('[', '](url)', 'link text');
        }
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
    };
    const addBold = () => {
        insertMarkdown('**', '**', 'bold text');
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addItalic = () => {
        insertMarkdown('*', '*', 'italic text');
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addCode = () => {
        insertMarkdown('`', '`', 'code');
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addCodeBlock = () => {
        insertMarkdown('```\n', '\n```', 'code block', true);
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addHeading1 = () => {
        insertMarkdown('# ', '', 'Heading 1', true);
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addHeading2 = () => {
        insertMarkdown('## ', '', 'Heading 2', true);
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addHeading3 = () => {
        insertMarkdown('### ', '', 'Heading 3', true);
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addHeading4 = () => {
        insertMarkdown('#### ', '', 'Heading 4', true);
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addHeading5 = () => {
        insertMarkdown('##### ', '', 'Heading 5', true);
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addBulletList = () => {
        insertAtCursor('- ', true);
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addNumberedList = () => {
        insertAtCursor('1. ', true);
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addLink = () => {
        insertMarkdown('[', '](url)', 'link text');
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addImage = () => {
        insertMarkdown('![', '](image-url)', 'alt text');
        if (textareaRef.current) textareaRef.current.focus();
    };
    const addHorizontalRule = () => {
        insertAtCursor('---', true);
        if (textareaRef.current) textareaRef.current.focus();
    };

    return (
        <Box>
            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    borderRadius: '12px 12px 0 0',
                    background: theme.palette.mode === 'dark'
                        ? 'rgba(50,50,50,0.9)'
                        : 'rgba(248,249,250,0.95)',
                    borderBottom: 'none',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap'}}>
                    <ButtonGroup variant="outlined" sx={{ '& .MuiIconButton-root': { minWidth: '40px', height: '40px' } }}>
                        <Tooltip title="Heading 1" arrow>
                            <IconButton onClick={addHeading1} onMouseDown={handleMouseDown}>
                                <Typography variant="body2" sx={{ fontWeight: 'semibold', fontSize: '16px' }}>H1</Typography>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Heading 2" arrow>
                            <IconButton onClick={addHeading2} onMouseDown={handleMouseDown}>
                                <Typography variant="body2" sx={{ fontWeight: 'semibold', fontSize: '16px' }}>H2</Typography>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Heading 3" arrow>
                            <IconButton onClick={addHeading3} onMouseDown={handleMouseDown}>
                                <Typography variant="body2" sx={{ fontWeight: 'semibold', fontSize: '16px' }}>H3</Typography>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Heading 4" arrow>
                            <IconButton onClick={addHeading4} onMouseDown={handleMouseDown}>
                                <Typography variant="body2" sx={{ fontWeight: 'semibold', fontSize: '16px' }}>H4</Typography>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Heading 5" arrow>
                            <IconButton onClick={addHeading5} onMouseDown={handleMouseDown}>
                                <Typography variant="body2" sx={{ fontWeight: 'semibold', fontSize: '16px' }}>H5</Typography>
                            </IconButton>
                        </Tooltip>
                    </ButtonGroup>

                    <Divider orientation="vertical" flexItem />

                    <ButtonGroup variant="outlined" sx={{ '& .MuiIconButton-root': { minWidth: '40px', height: '40px' } }}>
                        <Tooltip title="Bold (Ctrl+B)" arrow>
                            <IconButton onClick={addBold} onMouseDown={handleMouseDown}>
                                <FormatBold />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Italic (Ctrl+I)" arrow>
                            <IconButton onClick={addItalic} onMouseDown={handleMouseDown}>
                                <FormatItalic />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Inline Code" arrow>
                            <IconButton onClick={addCode} onMouseDown={handleMouseDown}>
                                <Code />
                            </IconButton>
                        </Tooltip>
                    </ButtonGroup>

                    <Divider orientation="vertical" flexItem />

                    <ButtonGroup variant="outlined" sx={{ '& .MuiIconButton-root': { minWidth: '40px', height: '40px' } }}>
                        <Tooltip title="Bullet List" arrow>
                            <IconButton onClick={addBulletList} onMouseDown={handleMouseDown}>
                                <FormatListBulleted />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Numbered List" arrow>
                            <IconButton onClick={addNumberedList} onMouseDown={handleMouseDown}>
                                <FormatListNumbered />
                            </IconButton>
                        </Tooltip>
                    </ButtonGroup>

                    <Divider orientation="vertical" flexItem />

                    <ButtonGroup variant="outlined" sx={{ '& .MuiIconButton-root': { minWidth: '40px', height: '40px' } }}>
                        <Tooltip title="Link (Ctrl+K)" arrow>
                            <IconButton onClick={addLink} onMouseDown={handleMouseDown}>
                                <LinkIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Image" arrow>
                            <IconButton onClick={addImage} onMouseDown={handleMouseDown}>
                                <ImageIcon />
                            </IconButton>
                        </Tooltip>
                    </ButtonGroup>

                    <Divider orientation="vertical" flexItem />

                    <ButtonGroup variant="outlined" sx={{ '& .MuiIconButton-root': { minWidth: '40px', height: '40px' } }}>
                        <Tooltip title="Code Block" arrow>
                            <IconButton onClick={addCodeBlock} onMouseDown={handleMouseDown}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px' }}>{'{ }'}</Typography>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Horizontal Rule" arrow>
                            <IconButton onClick={addHorizontalRule} onMouseDown={handleMouseDown}>
                                <HorizontalRule />
                            </IconButton>
                        </Tooltip>
                    </ButtonGroup>
                </Box>
            </Paper>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: '0 0 12px 12px',
                    background: theme.palette.mode === 'dark'
                        ? 'rgba(30,30,30,0.6)'
                        : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease',
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        minHeight: "70vh" ,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '16px',
                        fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', 'Consolas', monospace",
                        resize: 'none',
                        padding: '24px',
                        lineHeight: 1.8,
                        color: theme.palette.text.primary,
                        letterSpacing: '0.5px',
                    }}
                />
            </Paper>
        </Box>
    );
};

export default RichMarkdownEditor;