import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, CornerDownLeft } from 'lucide-react';
import { Assignee } from '../types';

interface QuickTaskInputProps {
  assignee: Assignee;
  assigneeName: string;
  themeColor: string;
  onAdd: (title: string, assignee: Assignee) => void;
}

export const QuickTaskInput: React.FC<QuickTaskInputProps> = ({ assignee, assigneeName, themeColor, onAdd }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title, assignee);
      setTitle(''); // Clear but keep open for rapid entry
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setTitle('');
    }
  };

  // Dynamic styles based on theme
  const buttonClass = themeColor === 'teal' 
    ? 'text-teal-600 hover:bg-teal-100 bg-teal-50' 
    : 'text-rose-600 hover:bg-rose-100 bg-rose-50';
    
  const borderClass = themeColor === 'teal' ? 'focus:border-teal-400' : 'focus:border-rose-400';

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className={`w-full py-3 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 transition-all group ${buttonClass.replace('bg-', 'hover:border-')}`}
      >
        <Plus size={18} />
        <span className="font-medium text-sm">Add task for {assigneeName}</span>
      </button>
    );
  }

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => !title.trim() && setIsExpanded(false)}
          placeholder={`What does ${assigneeName} need to do?`}
          className={`w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${themeColor === 'teal' ? 'focus:ring-teal-200' : 'focus:ring-rose-200'} ${borderClass}`}
        />
        <button 
          type="button" 
          onClick={() => setIsExpanded(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <X size={16} />
        </button>
      </form>
      <div className="flex items-center gap-2 mt-1 px-1">
        <span className="text-[10px] uppercase font-bold text-slate-400">Press</span> 
        <CornerDownLeft size={10} className="text-slate-400" />
        <span className="text-[10px] uppercase font-bold text-slate-400">to add</span>
      </div>
    </div>
  );
};