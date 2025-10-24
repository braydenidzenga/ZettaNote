import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const FloatingToolbar = ({ visible, x, y, onClose, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="toolbar"
      tabIndex={-1}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
        minWidth: '180px',
      }}
      className="floating-toolbar bg-base-100 dark:bg-base-200 border border-base-300 dark:border-base-400 shadow-lg dark:shadow-xl rounded-xl p-2"
      aria-label="Floating editor toolbar"
    >
      {children}
    </div>
  );
};


FloatingToolbar.propTypes = {
  visible: PropTypes.bool.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default FloatingToolbar;
