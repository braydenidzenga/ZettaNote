import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import authContext from '../../context/AuthProvider';
import { IoDocumentTextOutline } from "react-icons/io5";
import { BiPen } from "react-icons/bi";
import { motion, AnimatePresence } from 'framer-motion';

const Heading = () => {
  const { user } = useContext(authContext);
  const [isWritingHovered, setIsWritingHovered] = useState(false);
  const [isLearnHovered, setIsLearnHovered] = useState(false);

  return (
    <section className="w-full min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        {/* Main Heading */}
        <div className="heading-container mb-8">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-base-content mb-4 tracking-tighter leading-none">
            <span className="inline-block heading-word-1">Zetta</span>
            <span className="inline-block heading-word-2 text-primary ml-2">
              Note
            </span>
          </h1>

          {/* Subtle Tagline */}
          <div className="heading-tagline opacity-0">
            <p className="text-lg md:text-xl text-base-content/70 font-medium mb-8">
              Your thoughts, beautifully organized
            </p>
          </div>
        </div>

        {/* Minimalist CTA */}
        <div className="heading-cta opacity-0">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={user ? '/dashboard' : '/login'}>
              <button
                className="btn btn-primary btn-lg px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center"
                onMouseEnter={() => setIsWritingHovered(true)}
                onMouseLeave={() => setIsWritingHovered(false)}
              >
                <AnimatePresence>
                  {isWritingHovered && (
                    <motion.div
                      initial={{ opacity: 0, width: 0, x: 10 }}
                      animate={{ opacity: 1, width: 'auto', x: 0 }}
                      exit={{ opacity: 0, width: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <BiPen className='text-xl' />
                    </motion.div>
                  )}
                </AnimatePresence>
                Start Writing
              </button>
            </Link>
            <Link to="https://github.com/braydenidzenga/ZettaNote">
              <button
                className="btn btn-ghost btn-lg px-6 py-3 bg-secondary rounded-full text-lg font-semibold text-base-content/70 hover:text-base-content shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center"
                onMouseEnter={() => setIsLearnHovered(true)}
                onMouseLeave={() => setIsLearnHovered(false)}
              >
                <AnimatePresence>
                  {isLearnHovered && (
                    <motion.div
                      initial={{ opacity: 0, width: 0, x: 10 }}
                      animate={{ opacity: 1, width: 'auto', x: 0 }}
                      exit={{ opacity: 0, width: 0, x: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <IoDocumentTextOutline className='text-xl' />
                    </motion.div>
                  )}
                </AnimatePresence>
                Learn More
              </button>
            </Link>
          </div>
        </div>

        {/* Floating Elements for Visual Interest */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="floating-dot absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full opacity-30"></div>
          <div className="floating-dot absolute top-1/3 right-1/4 w-3 h-3 bg-secondary rounded-full opacity-20"></div>
          <div className="floating-dot absolute bottom-1/3 left-1/3 w-1 h-1 bg-accent rounded-full opacity-40"></div>
          <div className="floating-dot absolute bottom-1/4 right-1/3 w-2 h-2 bg-primary rounded-full opacity-25"></div>
        </div>
      </div>
    </section>
  );
};

export default Heading;
