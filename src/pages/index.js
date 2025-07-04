import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import LoadingComponent from '../components/LoadingComponent';

// Dynamically import the Home component with no SSR
const Home = dynamic(() => import('../components/Home'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #111122 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '1.2rem'
    }}>
      Loading 3D Experience...
    </div>
  ),
});

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate realistic loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setIsLoading(false), 300);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Cleanup function
    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  // Show loading component while initializing
  if (isLoading) {
    return (
      <LoadingComponent 
        onLoadingComplete={() => setIsLoading(false)}
        progress={Math.min(loadingProgress, 100)}
      />
    );
  }

  return (
    <>
      {/* Import global styles */}
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        html {
          scroll-behavior: smooth;
        }

        .hero-3d-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 1;
          pointer-events: none;
        }

        .hero-3d-background canvas {
          display: block !important;
          width: 100vw !important;
          height: 100vh !important;
        }

        .hero-section {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-content-overlay {
          position: relative;
          z-index: 10;
          pointer-events: auto;
        }

        .content-sections {
          position: relative;
          z-index: 10;
          background: white;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #14b8a6, #8b5cf6);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #0f766e, #7c3aed);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .hero-content-overlay {
            margin: 0 1rem;
            padding: 2rem !important;
          }
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          
          html {
            scroll-behavior: auto;
          }
        }

        /* Focus styles for accessibility */
        button:focus,
        input:focus,
        textarea:focus {
          outline: 2px solid #14b8a6;
          outline-offset: 2px;
        }
      `}</style>
      
      <Home />
    </>
  );
}