import React, { useState, useEffect } from 'react';

// GitHub-Style Smart Progress Bar - Moves slow initially, speeds up when content is ready
export const NavigationProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Slow phase (0-70%)
    const timer1 = setTimeout(() => setProgress(15), 100);
    const timer2 = setTimeout(() => setProgress(30), 250);
    const timer3 = setTimeout(() => setProgress(45), 450);
    const timer4 = setTimeout(() => setProgress(60), 700);
    const timer5 = setTimeout(() => setProgress(70), 1000);

    // Fast completion (70-100%)
    const completeTimer = setTimeout(() => {
      setProgress(85);
      setTimeout(() => setProgress(95), 50);
      setTimeout(() => setProgress(100), 100);
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(completeTimer);
    };
  }, []);

  const isCompleting = progress >= 70;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-0.5 bg-gray-100">
        <div
          className="h-full bg-gray-800 transition-all ease-out"
          style={{
            width: `${progress}%`,
            transitionDuration: isCompleting ? '80ms' : '300ms',
          }}
        />
      </div>
    </div>
  );
};

// Alternative darker version
export const DarkProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(15), 100);
    const timer2 = setTimeout(() => setProgress(30), 250);
    const timer3 = setTimeout(() => setProgress(45), 450);
    const timer4 = setTimeout(() => setProgress(60), 700);
    const timer5 = setTimeout(() => setProgress(70), 1000);

    const completeTimer = setTimeout(() => {
      setProgress(85);
      setTimeout(() => setProgress(95), 50);
      setTimeout(() => setProgress(100), 100);
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(completeTimer);
    };
  }, []);

  const isCompleting = progress >= 70;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-0.5 bg-gray-200">
        <div
          className="h-full bg-gray-900 transition-all ease-out"
          style={{
            width: `${progress}%`,
            transitionDuration: isCompleting ? '80ms' : '300ms',
          }}
        />
      </div>
    </div>
  );
};

// Sleek version with subtle shadow
export const SleekProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(15), 100);
    const timer2 = setTimeout(() => setProgress(30), 250);
    const timer3 = setTimeout(() => setProgress(45), 450);
    const timer4 = setTimeout(() => setProgress(60), 700);
    const timer5 = setTimeout(() => setProgress(70), 1000);

    const completeTimer = setTimeout(() => {
      setProgress(85);
      setTimeout(() => setProgress(95), 50);
      setTimeout(() => setProgress(100), 100);
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(completeTimer);
    };
  }, []);

  const isCompleting = progress >= 70;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-0.5 bg-gray-100">
        <div
          className="h-full bg-gray-800 transition-all ease-out shadow-sm"
          style={{
            width: `${progress}%`,
            transitionDuration: isCompleting ? '80ms' : '300ms',
            boxShadow: '0 0 8px rgba(31, 41, 55, 0.3)'
          }}
        />
      </div>
    </div>
  );
};

// Demo Component