'use client';
import Feature from '../Feature';
import { IoOptions } from 'react-icons/io5';
import {
  AiOutlineFileText,
  AiOutlineLink,
  AiOutlineEdit,
  AiOutlineLock,
  AiOutlineDashboard,
  AiOutlineCode,
  AiOutlineGithub,
  AiOutlineMobile,
  AiOutlineHistory,
} from 'react-icons/ai';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <AiOutlineFileText size={24} />,
    title: 'Private notes',
    desc: 'Create, edit, rename, and organize your notes with full privacy. Your thoughts stay yours until you decide to share.',
  },
  {
    icon: <AiOutlineLink size={24} />,
    title: 'Secure sharing',
    desc: 'Generate read-only public links to share specific notes. No account required for readers, full control for you.',
  },
  {
    icon: <AiOutlineEdit size={24} />,
    title: 'Rich markdown editor',
    desc: 'Write with a clean, distraction-free editor. Markdown support, autosave, and real-time preview for seamless note-taking.',
  },
  {
    icon: <AiOutlineLock size={24} />,
    title: 'Secure authentication',
    desc: 'Email/password authentication with secure session management. Change passwords, manage accounts, and delete data anytime.',
  },
  {
    icon: <AiOutlineDashboard size={24} />,
    title: 'Admin dashboard',
    desc: 'Comprehensive admin tools for user management, analytics, moderation, and system insights. Built for scalability.',
  },
  {
    icon: <AiOutlineCode size={24} />,
    title: 'Modern architecture',
    desc: 'Vite + React frontend, Node.js + MongoDB backend. Fast loading, responsive design, and developer-friendly codebase.',
  },
  {
    icon: <AiOutlineGithub size={24} />,
    title: 'Open source',
    desc: 'MIT licensed and community-driven. Fork, contribute, customize, or learn from the complete source code on GitHub.',
  },
  {
    icon: <AiOutlineMobile size={24} />,
    title: 'Responsive design',
    desc: 'Works beautifully on desktop, tablet, and mobile. Dark/light themes with smooth transitions and accessible UI.',
  },
  {
    icon: <AiOutlineHistory size={24} />,
    title: 'Version control',
    desc: 'Track changes, save drafts, and maintain edit history. Never lose your work with automatic backups and versioning.',
  },
];

const Features = () => {
  return (
    <div>
      <section className="features-section second max-w-6xl mx-auto mt-12">
        <h2 className="text-5xl font-semibold text-secondary flex items-center gap-3">
          <IoOptions />
          <span className="mb-2">Core features</span>
        </h2>
        <p className="mt-2 text-sm text-[color:var(--color-neutral-content)] max-w-2xl">
          Designed for writers, students and developers — minimal UI, fast editor and safe sharing.
        </p>
        <div className="mt-6 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="feature-item h-full flex flex-col"
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              aria-label={f.title}
            >
              <Feature icon={f.icon} title={f.title} desc={f.desc} />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Features;