import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

// ============================================
// LoadingScreen Component
// ============================================
export const LoadingScreen = ({ text = "SERVICEAPP", onComplete }) => {
  const [visible, setVisible] = useState(0);
  const letters = text.split("");

  useEffect(() => {
    if (visible < letters.length) {
      const timer = setTimeout(() => setVisible(v => v + 1), 180);
      return () => clearTimeout(timer);
    } else {
      const done = setTimeout(() => onComplete && onComplete(), 500);
      return () => clearTimeout(done);
    }
  }, [visible, letters.length, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="flex gap-4">
        {letters.map((ch, i) => (
          <span
            key={i}
            className="font-light tracking-[0.6rem]"
            style={{
              fontSize: "22px",
              opacity: i < visible ? 1 : 0.15,
              transition: "opacity 0.5s ease",
              color: "#d1d5db"
            }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
};
