import { useRef, useEffect, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import propTypes from 'prop-types';

const TableModal = ({
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
  closeTableModal,
  confirmInsertTable,
}) => {
  const modalContentRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Update visibility of the scroll-to-bottom button when modal content changes
  useEffect(() => {
    if (!showTableModal) return;
    const update = () => {
      const el = modalContentRef.current;
      if (!el) {
        setShowScrollToBottom(false);
        return;
      }
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

  if (!showTableModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-3xl w-full mx-4 relative flex flex-col max-h-[70vh]">
        {/* Scrollable content area */}
        <div
          ref={modalContentRef}
          className="p-6 overflow-y-auto no-scrollbar flex-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <h3 className="font-bold text-lg">Insert Table</h3>
          <p className="py-2 text-sm text-base-content/70">
            Specify rows and columns for your table.
          </p>

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

          {/* Live preview grid */}
          <div className="mt-4">
            <div className="text-sm mb-2">Preview:</div>
            <div className="overflow-auto overflow-x-auto border rounded">
              <table className="min-w-max table-auto text-sm whitespace-nowrap border border-base-300 border-collapse">
                <thead>
                  {includeHeader && (
                    <tr>
                      {includeSerial && (
                        <th className="border border-base-300 px-3 py-2 bg-base-200 text-sm font-medium text-base-content">
                          #
                        </th>
                      )}
                      {Array.from(
                        { length: Math.max(1, parseInt(tableColsInput || '1', 10)) },
                        (_, i) => (
                          <th
                            key={i}
                            className="border border-base-300 px-3 py-2 bg-base-200 text-sm font-medium text-base-content"
                          >
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
                        )
                      )}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {Array.from(
                    { length: Math.max(1, parseInt(tableRowsInput || '1', 10)) },
                    (_, r) => (
                      <tr key={r}>
                        {includeSerial && (
                          <td className="border border-base-300 px-3 py-2 text-sm text-base-content">
                            {r + 1}
                          </td>
                        )}
                        {Array.from(
                          { length: Math.max(1, parseInt(tableColsInput || '1', 10)) },
                          (_, c) => (
                            <td key={c} className="border border-base-300 px-3 py-2 text-sm">
                              <input
                                value={
                                  (tableData[r] && tableData[r][c]) ??
                                  `Cell ${r * Math.max(1, parseInt(tableColsInput || '1', 10)) + c + 1}`
                                }
                                onChange={(e) => {
                                  const newTd = tableData.map((row) => [...row]);
                                  if (!newTd[r]) newTd[r] = [];
                                  newTd[r][c] = e.target.value;
                                  setTableData(newTd);
                                }}
                                className="bg-transparent border-none p-0 text-sm w-full focus:outline-none"
                              />
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* modal actions */}
        <div className="p-4 border-t bg-base-100 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={closeTableModal}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={confirmInsertTable}>
            Insert Table
          </button>
        </div>

        {/* Scroll-to-bottom button shown when content overflows; positioned above actions */}
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
  );
};

TableModal.propTypes = {
  showTableModal: propTypes.bool.isRequired,
  tableRowsInput: propTypes.string.isRequired,
  setTableRowsInput: propTypes.func.isRequired,
  tableColsInput: propTypes.string.isRequired,
  setTableColsInput: propTypes.func.isRequired,
  includeHeader: propTypes.bool.isRequired,
  setIncludeHeader: propTypes.func.isRequired,
  includeSerial: propTypes.bool.isRequired,
  setIncludeSerial: propTypes.func.isRequired,
  headerData: propTypes.array.isRequired,
  setHeaderData: propTypes.func.isRequired,
  tableData: propTypes.array.isRequired,
  setTableData: propTypes.func.isRequired,
  closeTableModal: propTypes.func.isRequired,
  confirmInsertTable: propTypes.func.isRequired,
};

export default TableModal;
