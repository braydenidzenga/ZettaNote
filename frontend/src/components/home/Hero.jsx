import { Link } from 'react-router-dom';
import ExampleNote from './ExampleNote';

const Hero = () => {
  return (
    <div>
      <section className="first max-w-6xl mx-auto grid gap-20 lg:grid-cols-2 items-center">
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-4 ">
            <div className="hero-avatars  flex -space-x-2 ">
              <div className="pulse w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white flex items-center justify-center text-white text-sm font-semibold">
                A
              </div>
              <div className="pulse w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 border-2 border-white flex items-center justify-center text-white text-sm font-semibold">
                B
              </div>
              <div className="pulse w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-white flex items-center justify-center text-white text-sm font-semibold">
                C
              </div>
              <div className="pulse w-8 h-8 rounded-full bg-base-300 border-2 border-white flex items-center justify-center text-base-content text-sm font-semibold">
                +
              </div>
            </div>
            <span className="text-sm text-[color:var(--color-neutral-content)]">
              Join 1,000+ users taking notes
            </span>
          </div>

          <h1 className="hero-title text-3xl  lg:text-4xl font-extrabold text-[color:var(--color-base-content)]">
            ZettaNote — Minimal ✦ Private ✦ Shareable
          </h1>
          <p className="hero-description mt-4 text-base text-[color:var(--color-neutral-content)] max-w-xl leading-relaxed">
            The open-source note-taking app that puts privacy first. Create rich notes with markdown
            support, organize your thoughts, and share selectively with secure public links. Built
            for writers, developers, and thinkers who value simplicity and control.
          </p>

          <div className="hero-buttons mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[color:var(--color-primary)] text-[color:var(--color-primary-content)] hover:opacity-90 transition-opacity"
            >
              Create account
            </Link>

            <a
              href="https://github.com/braydenidzenga/ZettaNote"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md border border-[color:var(--color-base-300)] text-[color:var(--color-base-content)]"
            >
              View on GitHub
            </a>
          </div>

          <div className="hero-info-card mt-6 flex items-start gap-3 p-4 bg-[color:var(--color-base-200)] rounded-lg border border-[color:var(--color-base-300)]">
            <div className="float w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-[color:var(--color-base-content)]">
                Open-source & community-driven
              </div>
              <div className="text-sm text-[color:var(--color-neutral-content)] mt-1">
                Built by developers, for developers. Contribute features, fix bugs, or help with
                documentation on GitHub.
              </div>
            </div>
          </div>
        </div>

        <div className="hero-right space-y-6">
          <div className="rounded-xl p-6 bg-[color:var(--color-base-200)] border border-[color:var(--color-base-300)]">
            <h4 className="text-sm font-medium text-[color:var(--color-neutral-content)]">
              Quick demo note
            </h4>
            <div className="mt-4">
              <ExampleNote />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4 bg-[color:var(--color-base-200)] border border-[color:var(--color-base-300)]">
              <div className="text-sm text-[color:var(--color-neutral-content)]">Notes</div>
              <div className="mt-2 text-base font-semibold text-[color:var(--color-base-content)]">
                Private by default
              </div>
            </div>
            <div className="rounded-xl p-4 bg-[color:var(--color-base-200)] border border-[color:var(--color-base-300)]">
              <div className="text-sm text-[color:var(--color-neutral-content)]">Sharing</div>
              <div className="mt-2 text-base font-semibold text-[color:var(--color-base-content)]">
                Public links
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
