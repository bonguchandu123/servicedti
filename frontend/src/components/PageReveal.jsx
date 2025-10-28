// ============================================
// src/components/PageReveal.jsx
// ============================================

import React, { useState, useEffect } from 'react';


export const PageReveal = ({ children, onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2400;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        clearInterval(timer);
        if (onComplete) {
          setTimeout(onComplete, 200);
        }
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [onComplete]);

  const getCurvePath = () => {
    const width = 100;
    const height = 100 - progress;
    
    if (progress >= 100) {
      return `M 0 0 L ${width} 0 L ${width} 0 L 0 0 Z`;
    }
    
    const curveDepth = height * 0.15;
    const controlY = height - curveDepth;
    
    return `M 0 0 L ${width} 0 L ${width} ${height} Q ${width/2} ${controlY} 0 ${height} Z`;
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="w-full h-full">
        {children}
      </div>

      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="overlayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="1" />
            <stop offset="95%" stopColor="#000000" stopOpacity="1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path
          d={getCurvePath()}
          fill="url(#overlayGradient)"
        />
      </svg>
    </div>
  );
};