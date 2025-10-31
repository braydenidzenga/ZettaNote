import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useTableModal = (insertAtCursor) => {
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRowsInput, setTableRowsInput] = useState('3');
  const [tableColsInput, setTableColsInput] = useState('3');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeSerial, setIncludeSerial] = useState(true);
  const [headerData, setHeaderData] = useState([]);
  const [tableData, setTableData] = useState([]);

  // When rows or cols inputs change, clamp to max 20 and resize header/table data accordingly
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
        for (let c = 0; c < cols; c++)
          if (next[r][c] === undefined) next[r][c] = `Cell ${r * cols + c + 1}`;
        next[r].length = cols;
      }
      next.length = rows;
      return next;
    });
  }, [tableRowsInput, tableColsInput]);

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
        const val =
          tableData[r] && tableData[r][c] ? tableData[r][c] : `Cell ${r * cClamped + c + 1}`;
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

  return {
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
  };
};
