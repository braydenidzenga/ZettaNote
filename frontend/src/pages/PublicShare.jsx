import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiFile, 
  FiHome, 
  FiDownload, 
  FiExternalLink,
  FiClock,
  FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import { VITE_API_URL } from '../env';

const PublicShare = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedPage = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${VITE_API_URL}/api/pages/share/${shareId}`);
        
        if (response.status === 200 && response.data) {
          setPageData(response.data);
        } else {
          setError(response.data?.Error || response.data?.message || 'Failed to load shared page');
        }
      } catch (err) {
        console.error('Error fetching shared page:', err);
        if (err.response) {
          // Server responded with error status
          setError(err.response.data?.Error || err.response.data?.message || 'Failed to load shared page');
        } else if (err.request) {
          // Network error
          setError('Network error. Please check your connection.');
        } else {
          // Other error
          setError('Failed to load shared page. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSharedPage();
  }, [shareId]);

  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Enhanced markdown rendering for public view
    return text
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-3 text-base-content">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 text-base-content">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-6 text-base-content">$1</h1>')
      
      // Text formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-primary">$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')
      .replace(/~~(.*?)~~/g, '<del class="line-through opacity-75">$1</del>')
      .replace(/==(.*?)==/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
      .replace(/<u>(.*?)<\/u>/g, '<u class="underline">$1</u>')
      
      // Code
      .replace(/`([^`]+)`/g, '<code class="bg-base-200 text-primary px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-base-200 p-4 rounded-lg overflow-auto my-4 border"><code class="text-sm font-mono">$2</code></pre>')
      
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4 text-base-content/80">$1</blockquote>')
      
      // Lists
      .replace(/^- \[x\] (.*$)/gm, '<li class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="checkbox checkbox-primary checkbox-sm"> <span class="line-through opacity-75">$1</span></li>')
      .replace(/^- \[ \] (.*$)/gm, '<li class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="checkbox checkbox-sm"> $1</li>')
      .replace(/^- (.*$)/gm, '<li class="flex items-start gap-2 my-1"><span class="text-primary mt-1">•</span> $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="flex items-start gap-2 my-1 ml-4">$1</li>')
      
      // Links and images
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline font-medium">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-md my-4">')
      
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="border-base-300 my-8">')
      
      // Math (basic support)
      .replace(/\$\$(.*?)\$\$/g, '<div class="bg-base-200 p-4 rounded-lg text-center font-mono my-4">$1</div>')
      .replace(/\$([^$]+)\$/g, '<span class="bg-base-200 px-2 py-1 rounded font-mono text-sm">$1</span>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  const handleDownload = () => {
    if (!pageData) return;
    
    const element = document.createElement('a');
    const file = new Blob([pageData.content || ''], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${pageData.title || 'shared-page'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Page downloaded as Markdown file');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200">
        {/* Loading Header */}
        <div className="bg-base-100 border-b border-base-300 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-base-300 rounded-2xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-48 h-6 bg-base-300 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-base-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-base-100 rounded-2xl border border-base-300 p-8">
            <div className="space-y-4">
              <div className="w-full h-6 bg-base-300 rounded animate-pulse"></div>
              <div className="w-3/4 h-6 bg-base-300 rounded animate-pulse"></div>
              <div className="w-full h-32 bg-base-300 rounded animate-pulse"></div>
              <div className="w-2/3 h-6 bg-base-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <div className="bg-base-100 rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-base-300">
          <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiFile className="w-8 h-8 text-error" />
          </div>
          <h1 className="text-2xl font-bold text-base-content mb-3">Page Not Found</h1>
          <p className="text-base-content/70 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary w-full gap-2"
            >
              <FiHome className="w-4 h-4" />
              Go to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <FiFile className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-base-content">
                  {pageData?.title || 'Shared Page'}
                </h1>
                <div className="flex items-center gap-4 text-sm text-base-content/60 mt-1">
                  <div className="flex items-center gap-2">
                    <FiEye className="w-4 h-4" />
                    <span>Public View</span>
                  </div>
                  {pageData?.createdAt && (
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4" />
                      <span>Created {new Date(pageData.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="btn btn-outline btn-sm gap-2 hover:btn-secondary"
                title="Download as Markdown"
              >
                <FiDownload className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn btn-primary btn-sm gap-2"
                title="Try ZettaNote"
              >
                <FiHome className="w-4 h-4" />
                <span className="hidden sm:inline">Try ZettaNote</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">
          {/* Content Header */}
          <div className="p-6 border-b border-base-300/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-base-content/70">
                  Shared via ZettaNote
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-base-content/60">
                <span>Read-only access</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8 lg:p-12 min-h-[500px]">
            {pageData?.content ? (
              <div 
                className="prose prose-lg max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: `<p class="mb-4">${renderMarkdown(pageData.content)}</p>` 
                }}
              />
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-base-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiFile className="w-8 h-8 text-base-content/40" />
                </div>
                <h3 className="text-xl font-semibold text-base-content/60 mb-2">No Content</h3>
                <p className="text-base-content/50">This page appears to be empty.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-base-300/60 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-base-content/60 text-center sm:text-left">
                <span>Shared securely with </span>
                <span className="font-semibold text-primary">ZettaNote</span>
                <span> • Create your own notes for free</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-outline btn-sm gap-2 hover:btn-primary"
                >
                  <FiExternalLink className="w-4 h-4" />
                  Get ZettaNote
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicShare;