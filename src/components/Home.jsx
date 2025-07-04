import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black" />
  ),
});

export default function Home() {
  const [isSceneLoaded, setIsSceneLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSceneLoaded(true);
    }, 1000);

    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Hero Section with fully visible 3D Scene */}
      <section 
        className="relative flex items-center justify-center min-h-screen"
        style={{ 
          width: '100vw', 
          height: '100vh', 
          overflow: 'hidden'
        }}
      >
        {/* 3D Scene Background - Now completely visible */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          <Scene />
        </div>
        
        {/* Subtle floating particles */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 8,
            pointerEvents: 'none'
          }}
        >
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                backgroundColor: i % 3 === 0 ? '#14b8a655' : i % 3 === 1 ? '#8b5cf655' : '#06b6d455',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.4,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Main Content Container */}
        <div 
          className="text-center text-white max-w-6xl px-4 sm:px-8"
          style={{
            position: 'relative',
            zIndex: 10,
            pointerEvents: 'auto'
          }}
        >
          {/* Glass-morphism Content Card */}
          <div 
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '32px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: 'clamp(2rem, 5vw, 4rem)',
              boxShadow: '0 16px 32px -8px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Animated gradient background element */}
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255, 255, 255, 0.02) 90deg, transparent 180deg, rgba(255, 255, 255, 0.02) 270deg, transparent 360deg)',
                animation: 'rotate 20s linear infinite',
                zIndex: -1,
                opacity: 0.5
              }}
            />
            
            {/* Company Logo/Title */}
            <div style={{ marginBottom: '2rem' }}>
              <h1 
                style={{
                  fontSize: 'clamp(3.5rem, 12vw, 8rem)',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 25%, #8b5cf6 50%, #ec4899 75%, #f59e0b 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradientShift 4s ease-in-out infinite',
                  letterSpacing: '0.1em',
                  textShadow: '0 0 40px rgba(20, 184, 166, 0.3)',
                  margin: 0,
                  lineHeight: 1.1,
                  padding: '0.5rem 0'
                }}
              >
                ANAKUPTO
              </h1>
              
              <h2 
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 3.5rem)',
                  fontWeight: '300',
                  color: 'rgba(255, 255, 255, 0.95)',
                  marginTop: '1rem',
                  marginBottom: 0,
                  letterSpacing: '0.05em',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                }}
              >
                Software Development
              </h2>
              
              <div
                style={{
                  width: '100px',
                  height: '3px',
                  background: 'linear-gradient(90deg, #14b8a6, #8b5cf6)',
                  margin: '1.5rem auto',
                  borderRadius: '2px',
                  animation: 'pulse 2s ease-in-out infinite',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                }}
              />
            </div>
            
            <p 
              style={{
                fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                lineHeight: 1.7,
                color: 'rgba(255, 255, 255, 0.95)',
                maxWidth: '800px',
                margin: '0 auto 3rem',
                fontWeight: '400',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
              }}
            >
              Crafting innovative software solutions with cutting-edge technology.
              We transform your digital visions into reality through expert development, 
              stunning design, and unparalleled user experiences.
            </p>
            
            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                style={{
                  padding: '1rem 2.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, #14b8a6 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: '0 8px 24px rgba(20, 184, 166, 0.5)',
                  minWidth: '200px',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-8px) scale(1.05)';
                  e.target.style.boxShadow = '0 16px 48px rgba(20, 184, 166, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 8px 24px rgba(20, 184, 166, 0.5)';
                }}
              >
                <span style={{ position: 'relative', zIndex: 2 }}>
                  Start Your Project ✨
                </span>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    transition: 'left 0.6s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.left = '100%';
                  }}
                />
              </button>
              
              <button 
                style={{
                  padding: '1rem 2.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  minWidth: '200px',
                  zIndex: 10,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.transform = 'translateY(-8px) scale(1.05)';
                  e.target.style.boxShadow = '0 16px 48px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                View Our Work 🚀
              </button>
            </div>
            
            {/* Feature highlights */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '2rem',
                marginTop: '4rem',
                padding: '2rem 0'
              }}
            >
              {[
                { icon: '⚡', text: 'Lightning Fast', color: '#f59e0b' },
                { icon: '🛡️', text: 'Secure & Reliable', color: '#14b8a6' },
                { icon: '🎨', text: 'Beautiful Design', color: '#8b5cf6' },
                { icon: '📱', text: 'Mobile First', color: '#ec4899' }
              ].map((feature, index) => (
                <div
                  key={index}
                  style={{
                    textAlign: 'center',
                    padding: '1.5rem 1rem',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = `0 8px 24px ${feature.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ 
                    fontSize: '2rem', 
                    marginBottom: '0.5rem',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                  }}>
                    {feature.icon}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                  }}>
                    {feature.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Interactive Scroll Indicator */}
        <div 
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <div style={{ 
            fontSize: '0.9rem', 
            marginBottom: '0.5rem',
            fontWeight: '500',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
          }}>
            Discover More
          </div>
          <div 
            style={{
              fontSize: '1.5rem',
              animation: 'bounce 2s infinite',
              background: 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 4px 20px rgba(20, 184, 166, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px) scale(1.1)';
              e.target.style.boxShadow = '0 8px 24px rgba(20, 184, 166, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 20px rgba(20, 184, 166, 0.5)';
            }}
          >
            ↓
          </div>
        </div>
      </section>

      {/* Rest of your content sections would go here */}
      {/* ... */}

      {/* Enhanced CSS animations and effects */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40%, 43% {
            transform: translateX(-50%) translateY(-12px);
          }
          70% {
            transform: translateX(-50%) translateY(-6px);
          }
          90% {
            transform: translateX(-50%) translateY(-3px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.4;
          }
          33% {
            transform: translateY(-20px) rotate(120deg);
            opacity: 0.8;
          }
          66% {
            transform: translateY(-10px) rotate(240deg);
            opacity: 0.6;
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        /* Improved focus states */
        input:focus,
        textarea:focus,
        select:focus,
        button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.3);
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .hero-content {
            margin: 0 1rem;
            padding: 2rem !important;
          }
          
          .grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          
          .flex-col button,
          .flex-row button {
            width: 100%;
            margin-bottom: 1rem;
          }
        }

        @media (max-width: 480px) {
          section {
            padding: 3rem 0 !important;
          }
          
          .max-w-7xl,
          .max-w-6xl {
            padding: 0 1rem !important;
          }
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}