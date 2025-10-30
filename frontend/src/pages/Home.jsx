import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CommunityAndContribution from '../components/home/CommunityAndContribution';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import Heading from '../components/home/Heading';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const containerRef = useRef();

  useGSAP(
    () => {
      // Main heading animations
      const headingTl = gsap.timeline({ delay: 0.3 });

      headingTl
        .from('.heading-word-1', {
          opacity: 0,
          y: 100,
          rotationX: -90,
          duration: 1.2,
          ease: 'power3.out',
        })
        .from(
          '.heading-word-2',
          {
            opacity: 0,
            y: 100,
            rotationX: -90,
            duration: 1.2,
            ease: 'power3.out',
          },
          '-=0.8'
        )
        .to(
          '.heading-tagline',
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.4'
        )
        .to(
          '.heading-cta',
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.2'
        );

      // Floating dots animation
      gsap.to('.floating-dot', {
        y: -20,
        x: 10,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.5,
          from: 'random',
        },
      });

      // Hero section animations
      const masterTl = gsap.timeline({ delay: 2 });

      masterTl
        .from('.hero-avatars > div', {
          scale: 0,
          rotation: 180,
          duration: 0.6,
          ease: 'back.out(1.7)',
          stagger: 0.1,
        })
        .from(
          '.hero-title',
          {
            opacity: 0,
            y: 50,
            duration: 1,
            ease: 'power3.out',
          },
          '-=0.3'
        )
        .from(
          '.hero-description',
          {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.5'
        )
        .from(
          '.hero-buttons > *',
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: 'power2.out',
            stagger: 0.1,
          },
          '-=0.4'
        )
        .from(
          '.hero-info-card',
          {
            opacity: 0,
            x: -50,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.3'
        )
        .from(
          '.hero-right',
          {
            opacity: 0,
            x: 50,
            duration: 1,
            ease: 'power2.out',
          },
          '-=0.8'
        );

      // Features section with scroll trigger
      gsap.from('.feature-item', {
        scrollTrigger: {
          trigger: '.features-section',
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 60,
        scale: 0.9,
        duration: 0.8,
        ease: 'power3.out',
        stagger: {
          amount: 0.6,
          grid: [3, 3],
          from: 'start',
        },
      });

      // Community section with scroll trigger
      gsap.from('.community-section', {
        scrollTrigger: {
          trigger: '.community-section',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 80,
        duration: 1.2,
        ease: 'power3.out',
      });

      // Animate community cards
      gsap.from('.community-card', {
        scrollTrigger: {
          trigger: '.community-cards',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.2,
      });

      // Floating animation for elements
      gsap.to('.float', {
        y: -10,
        duration: 2,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
      });

      // Pulse animation for interactive elements
      gsap.to('.pulse', {
        scale: 1.05,
        duration: 1.5,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.5,
      });

      // Heading button hover animations
      const buttons = document.querySelectorAll('.heading-cta button');
      buttons.forEach((button) => {
        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
        });
      });

      // Scroll-triggered heading fade
      gsap.to('.heading-container', {
        scrollTrigger: {
          trigger: '.heading-container',
          start: 'bottom 80%',
          end: 'bottom 20%',
          scrub: 1,
        },
        opacity: 0.3,
        y: -50,
        ease: 'none',
      });
    },
    { scope: containerRef }
  );

  return (
    <main
      ref={containerRef}
      className="min-h-screen mt-20 p-6 lg:p-12"
      style={{ backgroundColor: 'var(--color-base-100)' }}
    >
      <Heading />
      <Hero />
      <Features />
      <CommunityAndContribution />
    </main>
  );
};

export default Home;
