import { useState, useEffect } from 'react';

const LoadingComponent = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const loadingSteps = [
      { progress: 20, text: 'Loading 3D Engine...' },
      { progress: 40, text: 'Generating Puzzle Pieces...' },
      { progress: 60, text: 'Configuring Physics...' },
      { progress: 80, text: 'Setting up Interlock System...' },
      { progress: 100, text: 'Ready!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        setProgress(loadingSteps[currentStep].progress);
        setLoadingText(loadingSteps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onLoadingComplete && onLoadingComplete();
        }, 500);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div className="loading-container">
      <div className="loading-content">
        {/* Animated 3D-style logo */}
        <div className="logo-container">
          <div className="puzzle-piece piece-1"></div>
          <div className="puzzle-piece piece-2"></div>
          <div className="puzzle-piece piece-3"></div>
        </div>
        
        {/* Loading text */}
        <h1 className="loading-title">Puzzle Dynamics</h1>
        <p className="loading-subtitle">{loadingText}</p>
        
        {/* Progress bar */}
        <div className="progress-container">
          <div 
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">{progress}%</span>
      </div>

      <style jsx>{`
        .loading-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #111122 0%, #1a1a2e 50%, #16213e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          overflow: hidden;
        }

        .loading-content {
          text-align: center;
          color: white;
          max-width: 400px;
          padding: 2rem;
        }

        .logo-container {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 2rem;
          perspective: 1000px;
        }

        .puzzle-piece {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 8px;
          animation: float 3s ease-in-out infinite;
        }

        .piece-1 {
          background: linear-gradient(45deg, #44aa88, #66ccaa);
          top: 0;
          left: 0;
          animation-delay: 0s;
          transform-style: preserve-3d;
        }

        .piece-2 {
          background: linear-gradient(45deg, #aa8844, #ccaa66);
          top: 0;
          right: 0;
          animation-delay: 0.5s;
          transform-style: preserve-3d;
        }

        .piece-3 {
          background: linear-gradient(45deg, #8844aa, #aa66cc);
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          animation-delay: 1s;
          transform-style: preserve-3d;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotateX(0) rotateY(0);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          }
          33% {
            transform: translateY(-10px) rotateX(15deg) rotateY(15deg);
            box-shadow: 0 15px 25px rgba(0,0,0,0.4);
          }
          66% {
            transform: translateY(-5px) rotateX(-10deg) rotateY(-10deg);
            box-shadow: 0 10px 20px rgba(0,0,0,0.35);
          }
        }

        .loading-title {
          font-family: 'Arial', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
          background: linear-gradient(45deg, #44aa88, #aa8844, #8844aa);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s ease-in-out infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .loading-subtitle {
          font-size: 1.1rem;
          margin: 0 0 2rem;
          color: #88aacc;
          font-weight: 300;
          opacity: 0.9;
          min-height: 1.5rem;
          transition: all 0.3s ease;
        }

        .progress-container {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 1rem;
          backdrop-filter: blur(10px);
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #44aa88, #aa8844, #8844aa);
          background-size: 200% 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
          animation: progressGlow 2s linear infinite;
        }

        @keyframes progressGlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .progress-text {
          font-size: 0.9rem;
          color: #88aacc;
          font-weight: 500;
        }

        /* Add some floating particles for extra flair */
        .loading-container::before,
        .loading-container::after {
          content: '';
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: float-particle 6s linear infinite;
        }

        .loading-container::before {
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .loading-container::after {
          top: 70%;
          right: 15%;
          animation-delay: 3s;
        }

        @keyframes float-particle {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(0);
            opacity: 0;
          }
        }

        @media (max-width: 480px) {
          .loading-title {
            font-size: 2rem;
          }
          
          .logo-container {
            width: 100px;
            height: 100px;
          }
          
          .puzzle-piece {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingComponent;