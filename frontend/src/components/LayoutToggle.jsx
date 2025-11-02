import React from 'react';
import { LayoutGrid, Menu } from 'lucide-react';

const LayoutToggle = ({ layoutMode, onToggle }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-full shadow-xl border border-gray-200 p-1 flex items-center gap-1">
        <button
          onClick={() => onToggle('sidebar')}
          className={`p-3 rounded-full transition-all ${
            layoutMode === 'sidebar'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Sidebar Layout"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => onToggle('navbar')}
          className={`p-3 rounded-full transition-all ${
            layoutMode === 'navbar'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Navbar Layout"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
      </div>
      
      {/* Label */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-600 font-medium">
          {layoutMode === 'sidebar' ? 'Sidebar Mode' : 'Navbar Mode'}
        </p>
      </div>
    </div>
  );
};

export default LayoutToggle;