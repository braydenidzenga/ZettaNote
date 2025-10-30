import { Github, Globe, Files, Twitter, Linkedin, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-base-300 py-10 px-4 md:px-8 text-sm text-base-content/80">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Top: Brand + Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          {/* Brand */}
          <div className="md:col-span-2 text-center md:text-left">
            <h2 className="text-lg font-semibold text-base-content">ZettaNote</h2>
            <p className="max-w-md text-sm mt-1 mx-auto md:mx-0">
              An open-source note-taking platform — create, edit, and share notes effortlessly.
              Built with ❤️ by the community.
            </p>
            <div className="mt-4 flex justify-center md:justify-start gap-4 text-base-content/80">
              <a
                href="https://zettanote.tech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open ZettaNote website in a new tab"
                title="Website"
                className="hover:text-primary inline-flex items-center gap-1"
              >
                <Globe size={16} />
                <span>Website</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open documentation in a new tab"
                title="Documentation"
                className="hover:text-primary inline-flex items-center gap-1"
              >
                <Files size={16} />
                <span>Documentation</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="col-span-2 grid grid-cols-2 gap-6 md:gap-8" aria-label="Footer navigation">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-base-content/60">Product</h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <a href="/" className="hover:text-primary">Home</a>
                </li>
                <li>
                  <a href="/dashboard" className="hover:text-primary">Dashboard</a>
                </li>
                <li>
                  <a href="/signup" className="hover:text-primary">Get Started</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-base-content/60">Resources</h3>
              <ul className="mt-2 space-y-1">
                <li>
                  <a
                    href="https://github.com/ikeshav26/ZettaNote"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    Contribute
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/ikeshav26/ZettaNote/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    Issues
                  </a>
                </li>
                <li>
                  <a
                    href="https://zettanote.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          {/* Support Section */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
            <h3 className="text-xs uppercase tracking-wide text-base-content/60">Support</h3>
            <ul className="mt-2 space-y-1 flex flex-col items-center md:items-start">
              <li>
                <a href="tel:+1234567890" className="hover:text-primary" aria-label="Call Support">+1 (234) 567-890</a>
              </li>
              <li>
                <a href="https://goo.gl/maps/KcKevU7nDVC2" target="_blank" rel="noopener noreferrer" className="hover:text-primary" aria-label="View address on map">
                  1234 Note Ave, City, Country
                </a>
              </li>
            </ul>
            <div className="mt-2 flex gap-3 justify-center md:justify-start">
              <a
                href="https://github.com/braydenidzenga/ZettaNote"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ZettaNote on GitHub"
                title="GitHub"
                className="hover:text-primary inline-flex items-center"
              >
                <Github size={18} />
              </a>
              <a
                href="https://twitter.com/ZettaNote"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ZettaNote on Twitter"
                title="Twitter"
                className="hover:text-primary inline-flex items-center"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://www.linkedin.com/company/ZettaNote"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ZettaNote on LinkedIn"
                title="LinkedIn"
                className="hover:text-primary inline-flex items-center"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://discord.gg/zetta-note"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join the ZettaNote Discord"
                title="Discord"
                className="hover:text-primary inline-flex items-center"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom: Legal */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-base-300 pt-4 text-xs text-base-content/60">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} ZettaNote. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4">
            <a href="/privacy" className="hover:text-primary">Privacy</a>
            <span className="hidden md:inline" aria-hidden>•</span>
            <a href="/terms" className="hover:text-primary">Terms</a>
            <span className="hidden md:inline" aria-hidden>•</span>
            <span>
              Contributions welcome on{' '}
              <a
                href="https://github.com/ikeshav26/ZettaNote"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                GitHub
              </a>
              .
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
