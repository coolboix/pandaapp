import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { parseTaskFromText } from '../services/geminiService';
import { Task, Assignee, UserProfile } from '../types';
import { generateId } from '../services/storage';

interface MagicInputProps {
  onAddTask: (task: Task) => void;
  users: Record<string, UserProfile>;
}

export const MagicInput: React.FC<MagicInputProps> = ({ onAddTask, users }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    
    // Optimistic fallback if AI fails or key is missing
    const fallbackTask: Task = {
        id: generateId(),
        title: input,
        status: 'todo',
        assignee: 'shared',
        color: '#a5b4fc', // default indigo-300
        createdAt: Date.now(),
        order: 0 // Placeholder order, will be recalculated by parent
    };

    try {
        const magicResult = await parseTaskFromText(input, { userA: users.userA.name, userB: users.userB.name });
        
        if (magicResult) {
            onAddTask({
                id: generateId(),
                title: magicResult.title,
                description: magicResult.description,
                status: magicResult.status,
                assignee: magicResult.assignee,
                dueDate: magicResult.dueDate || undefined,
                color: magicResult.priorityColor || '#a5b4fc',
                createdAt: Date.now(),
                order: 0 // Placeholder order, will be recalculated by parent
            });
        } else {
             // Use fallback if AI returns null (e.g. error)
             onAddTask(fallbackTask);
        }
    } catch (err) {
        onAddTask(fallbackTask);
    } finally {
        setIsLoading(false);
        setInput('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-20">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-purple-500">
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoading ? "AI is creating your task..." : "Ask AI to add a task (e.g., 'Remind Alice to buy coffee on Monday')"}
          className="w-full pl-10 pr-12 py-4 bg-white rounded-2xl shadow-lg border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-slate-700 placeholder-slate-400 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-2 bottom-2 aspect-square bg-purple-500 hover:bg-purple-600 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors"
        >
          <ArrowRight size={20} />
        </button>
      </form>
      <div className="text-center mt-2">
         <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
             Powered by Gemini • Magic Add
         </p>
      </div>
    </div>
  );
};