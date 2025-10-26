import React, { useState, useEffect } from 'react';

// LoadingCurtain Component
const LoadingCurtain = ({
  children,
  loadingText = "LOADING",
  loadingDuration = 1500,  // Shorter initial loading
  curtainDuration = 2000   // Faster curtain swipe
}) => {
  const [showLoading, setShowLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState('loading'); // 'loading', 'curtain', 'complete'

  useEffect(() => {
    const curtainTimer = setTimeout(() => setLoadingPhase('curtain'), loadingDuration);
    const completeTimer = setTimeout(() => {
      setLoadingPhase('complete');
      setShowLoading(false);
    }, loadingDuration + curtainDuration);

    return () => {
      clearTimeout(curtainTimer);
      clearTimeout(completeTimer);
    };
  }, [loadingDuration, curtainDuration]);

  if (!showLoading) return <>{children}</>;

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Page behind curtain */}
      <div className="absolute inset-0 z-0">{children}</div>

      {/* Curtain */}
      <div
        className="fixed inset-0 bg-black z-50"
        style={{
          height: loadingPhase === 'curtain' ? '0%' : '100%',
          bottom: 0,
          top: 'auto',
          transition: loadingPhase === 'curtain'
            ? `height ${curtainDuration}ms cubic-bezier(0, 0, 0.58, 1)` // fast start, fast end
            : 'none',
        }}
      >
        {/* Loading Text */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            loadingPhase === 'loading' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex space-x-3 md:space-x-4">
            {loadingText.split('').map((letter, index) => (
              <span
                key={index}
                className="text-3xl md:text-4xl lg:text-5xl font-extralight animate-fade-in"
                style={{
                  animationDelay: `${index * 0.05}s`, // faster fade-in
                  opacity: 0,
                  animationFillMode: 'forwards',
                  color: '#9ca3af',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontWeight: '200',
                  letterSpacing: '0.3em',
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* Semi-circle edge */}
        <div
          className={`absolute top-0 left-0 right-0 overflow-hidden transition-opacity duration-300 ${
            loadingPhase === 'curtain' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ height: '150px', transform: 'translateY(-149px)' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1000 150" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d="M 0,150 Q 500,20 1000,150 L 1000,150 L 0,150 Z" fill="#000000" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default LoadingCurtain;
