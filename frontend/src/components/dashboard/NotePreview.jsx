import { FiEye } from 'react-icons/fi';
import { renderMarkdown } from '../../utils/markdownRenderer.js';
import propTypes from 'prop-types';

const NotePreview = ({ editorContent }) => {
  return (
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
  );
};

NotePreview.propTypes = {
  editorContent: propTypes.string.isRequired,
};

export default NotePreview;
