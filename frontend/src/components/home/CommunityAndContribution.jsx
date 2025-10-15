import { useContext } from 'react';
import { Link } from 'react-router-dom';
import authContext from '../../context/AuthProvider';

const CommunityAndContribution = () => {
  const { user } = useContext(authContext);
  return (
    <div>
      {/* COMMUNITY & CONTRIBUTION */}
      <section className="community-section third max-w-4xl mx-auto mt-12 bg-[color:var(--color-base-200)] border border-[color:var(--color-base-300)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex -space-x-3">
            <div className="float w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border-2 border-white flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="float w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 border-2 border-white flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="float w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 border-2 border-white flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[color:var(--color-base-content)]">
            Built by the community
          </h3>
        </div>

        <div className="mt-3 text-sm text-[color:var(--color-neutral-content)] space-y-4">
          <p>
            <strong>ZettaNote</strong> is an <strong>open-source</strong> notes application that
            combines the simplicity of markdown with the power of modern web technologies. Our
            mission is to create the most intuitive and secure note-taking experience while keeping
            everything transparent and community-driven.
          </p>

          <div className="community-cards grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="community-card bg-[color:var(--color-base-100)] rounded-lg p-4 border border-[color:var(--color-base-300)]">
              <h4 className="font-semibold text-[color:var(--color-base-content)] mb-2">
                Core Capabilities
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• Create, edit, rename, and delete notes</li>
                <li>• Markdown support with live preview</li>
                <li>• Automatic saving and version history</li>
                <li>• Secure user authentication & sessions</li>
                <li>• Generate shareable public links</li>
                <li>• Admin dashboard for user management</li>
              </ul>
            </div>
            <div className="community-card bg-[color:var(--color-base-100)] rounded-lg p-4 border border-[color:var(--color-base-300)]">
              <h4 className="font-semibold text-[color:var(--color-base-content)] mb-2">
                Technical Stack
              </h4>
              <ul className="space-y-1 text-sm">
                <li>• React 18 + Vite for lightning-fast dev</li>
                <li>• Node.js + Express.js backend API</li>
                <li>• MongoDB for data persistence</li>
                <li>• Tailwind CSS + DaisyUI components</li>
                <li>• JWT authentication & bcrypt security</li>
                <li>• Docker support for easy deployment</li>
              </ul>
            </div>
          </div>

          <div className="bg-[color:var(--color-base-100)] rounded-lg p-4 border border-[color:var(--color-base-300)]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-primary-content"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-[color:var(--color-base-content)] text-sm">
                  Want to contribute?
                </div>
                <div className="text-[color:var(--color-neutral-content)] text-sm mt-1">
                  We welcome all types of contributions: code, documentation, design, testing, and
                  ideas. Check out our GitHub repository for open issues and contribution
                  guidelines.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <a
              href="https://github.com/braydenidzenga/ZettaNote"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[color:var(--color-base-300)] hover:bg-[color:var(--color-base-100)] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View Repository
            </a>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[color:var(--color-primary)] text-[color:var(--color-primary-content)] hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Start Taking Notes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CommunityAndContribution;
