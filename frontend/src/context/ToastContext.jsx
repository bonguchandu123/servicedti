import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Create Context
const ToastContext = createContext(null);

// Custom Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Enhanced Confetti Component with various shapes and type-specific particles
const Confetti = ({ type }) => {
  const colors = {
    success: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
    error: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'],
    warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
    info: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']
  };

  // Different emojis/particles for each type
  const particles = {
    success: ['🎉'],
    error: ['❌', '⚠️'],
    warning: ['⚡', '⚠️', '💡'],
    info: ['💡']
  };

  const shapes = ['circle', 'square', 'triangle', 'star'];
  const confettiColors = colors[type];
  const typeParticles = particles[type];
  const confettiCount = 30;

  return (
    <div className="confetti-container">
      {/* Geometric confetti shapes */}
      {[...Array(confettiCount)].map((_, i) => {
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = Math.random() * 6 + 4;
        
        return (
          <div
            key={i}
            className={`confetti confetti-${shape}`}
            style={{
              '--rotation': `${Math.random() * 720}deg`,
              '--x': `${(Math.random() - 0.5) * 300}px`,
              '--y': `${-100 - Math.random() * 150}px`,
              '--delay': `${Math.random() * 0.3}s`,
              '--duration': `${1.4 + Math.random() * 0.6}s`,
              backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
        );
      })}
      
      {/* Type-specific emoji particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`emoji-${i}`}
          className="emoji-particle"
          style={{
            '--spark-x': `${(Math.random() - 0.5) * 280}px`,
            '--spark-y': `${-90 - Math.random() * 140}px`,
            '--spark-delay': `${Math.random() * 0.3}s`,
            '--spark-duration': `${1.5 + Math.random() * 0.7}s`,
            left: '50%',
            top: '50%',
          }}
        >
          {typeParticles[Math.floor(Math.random() * typeParticles.length)]}
        </div>
      ))}

      {/* Additional sparkle particles for success */}
      {type === 'success' && [...Array(8)].map((_, i) => (
        <div
          key={`success-sparkle-${i}`}
          className="sparkle-extra"
          style={{
            '--spark-x': `${(Math.random() - 0.5) * 200}px`,
            '--spark-y': `${-70 - Math.random() * 100}px`,
            '--spark-delay': `${0.3 + Math.random() * 0.3}s`,
            left: '50%',
            top: '50%',
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
};

// Toast Component
const Toast = ({ id, message, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    error: <AlertCircle className="w-6 h-6 text-red-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300',
    error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300',
    warning: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300',
    info: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300'
  };

  return (
    <div className="toast-wrapper">
      <Confetti type={type} />
      <div
        className={`flex items-center gap-3 min-w-[340px] max-w-md p-4 rounded-xl border-2 shadow-2xl backdrop-blur-sm ${bgColors[type]} toast-content`}
      >
        <div className="flex-shrink-0 icon-bounce">
          {icons[type]}
        </div>
        <p className="flex-1 text-sm font-semibold text-gray-800">
          {message}
        </p>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/50 transition-all duration-200 hover:scale-110"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={onClose}
          />
        ))}
      </div>
      <style>{`
        .toast-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .confetti-container {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
          z-index: 10;
        }

        .confetti {
          position: absolute;
          top: 50%;
          left: 50%;
          animation: confetti-burst var(--duration, 1s) ease-out var(--delay, 0s) forwards;
          opacity: 0;
          transform-origin: center;
        }

        .confetti-circle {
          border-radius: 50%;
        }

        .confetti-square {
          border-radius: 2px;
        }

        .confetti-triangle {
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 8px solid currentColor;
        }

        .confetti-star {
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }

        @keyframes confetti-burst {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(0);
            opacity: 1;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), var(--y)) rotate(var(--rotation)) scale(1);
            opacity: 0;
          }
        }

        .sparkle {
          position: absolute;
          font-size: 12px;
          animation: sparkle-float 1s ease-out var(--spark-delay, 0s) forwards;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes sparkle-float {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
            transform: translate(calc(var(--spark-x) * 0.5), calc(var(--spark-y) * 0.5)) scale(1.2);
          }
          100% {
            transform: translate(var(--spark-x), var(--spark-y)) scale(0.5);
            opacity: 0;
          }
        }

        .emoji-particle {
          position: absolute;
          font-size: 16px;
          animation: emoji-burst var(--spark-duration, 1.8s) ease-out var(--spark-delay, 0s) forwards;
          opacity: 0;
          pointer-events: none;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }

        @keyframes emoji-burst {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(0);
            opacity: 1;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--spark-x), var(--spark-y)) rotate(360deg) scale(0.8);
            opacity: 0;
          }
        }

        .sparkle-extra {
          position: absolute;
          font-size: 14px;
          animation: sparkle-twinkle 1.6s ease-out var(--spark-delay, 0s) forwards;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes sparkle-twinkle {
          0% {
            transform: translate(0, 0) scale(0) rotate(0deg);
            opacity: 1;
          }
          30% {
            opacity: 1;
            transform: translate(calc(var(--spark-x) * 0.3), calc(var(--spark-y) * 0.3)) scale(1.5) rotate(180deg);
          }
          60% {
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--spark-x), var(--spark-y)) scale(0.6) rotate(360deg);
            opacity: 0;
          }
        }

        .toast-content {
          animation: toast-rise-from-center 0.9s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          opacity: 0;
          transform: scale(0.3) translateY(calc(50vh - 50%));
          position: relative;
          z-index: 1;
        }

        @keyframes toast-rise-from-center {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(calc(50vh - 50%));
          }
          40% {
            opacity: 1;
          }
          60% {
            transform: scale(1.05) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .icon-bounce {
          animation: icon-bounce 0.8s ease-in-out 0.5s;
        }

        @keyframes icon-bounce {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.2);
          }
          50% {
            transform: scale(0.9);
          }
          75% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

