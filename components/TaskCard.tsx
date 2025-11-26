import React from 'react';
import { Task, Assignee, UserProfile } from '../types';
import { Calendar, CheckCircle2, Circle, Trash2, ArrowRightLeft, RotateCcw, X, GripVertical } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  users: Record<string, UserProfile>;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetTaskId: string) => void;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  users, 
  onUpdate, 
  onDelete, 
  onRestore, 
  onPermanentDelete,
  onDragStart,
  onDragOver,
  onDrop,
  className = '' 
}) => {
  
  const toggleStatus = () => {
    if (task.isDeleted) return;
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    onUpdate({ ...task, status: nextStatus });
  };

  const handleAssigneeChange = (newAssignee: Assignee) => {
    if (task.isDeleted) return;
    onUpdate({ ...task, assignee: newAssignee });
  };

  const handleDropWrapper = (e: React.DragEvent) => {
    if (onDrop) {
        e.stopPropagation(); // Prevent the container from handling this drop
        onDrop(e, task.id);
    }
  };

  const isDone = task.status === 'done';
  const isDeleted = task.isDeleted;

  // Determine container classes based on state
  const finalClassName = `relative group rounded-xl border p-4 transition-all select-none ${
    isDeleted 
      ? 'bg-slate-50 border-slate-300 border-dashed opacity-60 hover:opacity-100' 
      : `shadow-sm hover:shadow-md ${className || 'bg-white border-slate-100'}`
  }`;

  // Styles object for dynamic border
  const style = isDeleted 
    ? { borderLeft: `4px solid #cbd5e1` } 
    : { borderLeft: `4px solid ${task.color}` };

  return (
    <div 
      className={finalClassName}
      style={style}
      draggable={!isDeleted && !!onDragStart}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragOver={onDragOver}
      onDrop={handleDropWrapper}
    >
      <div className="flex items-start justify-between gap-3">
        
        {/* Drag Handle (Visible on Hover) */}
        {!isDeleted && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 cursor-grab active:cursor-grabbing -ml-1">
             <GripVertical size={16} />
          </div>
        )}

        {/* Checkbox / Status Toggle */}
        <button 
          onClick={toggleStatus}
          disabled={isDeleted}
          className={`mt-1 flex-shrink-0 transition-colors z-10 ${
            isDeleted ? 'cursor-not-allowed opacity-0' : 
            isDone ? 'text-green-500' : 'text-slate-300 hover:text-slate-400'
          }`}
        >
          {!isDeleted && (isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />)}
        </button>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <h4 className={`font-semibold text-slate-800 leading-tight ${isDone || isDeleted ? 'line-through text-slate-400' : ''}`}>
            {task.title}
          </h4>
          {task.description && (
            <p className={`text-sm text-slate-500 mt-1 line-clamp-2 ${isDone || isDeleted ? 'line-through text-slate-300' : ''}`}>
              {task.description}
            </p>
          )}
          
          <div className={`flex flex-wrap items-center gap-2 mt-3 text-xs ${isDeleted ? 'opacity-50' : 'text-slate-400'}`}>
             {isDeleted && <span className="text-red-400 font-medium px-2 py-0.5 bg-red-50 rounded-md">Deleted</span>}
            
             {!isDeleted && task.dueDate && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${isDone ? 'bg-slate-100' : 'bg-blue-50 text-blue-600'}`}>
                <Calendar size={12} />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {/* Assignee Badge */}
            {!isDeleted && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                {task.assignee === 'shared' ? 'Shared' : users[task.assignee]?.name}
                </div>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {isDeleted ? (
            <>
               <button 
                onClick={() => onRestore(task.id)}
                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Restore Task"
              >
                <RotateCcw size={16} />
              </button>
               <button 
                onClick={() => onPermanentDelete(task.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Forever"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
                <button 
                    onClick={() => onDelete(task.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Task"
                >
                    <Trash2 size={16} />
                </button>
                
                <div className="relative group/move">
                    <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <ArrowRightLeft size={16} />
                    </button>
                    {/* Dropdown for reassignment */}
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-1 hidden group-hover/move:block z-10">
                        <button 
                        onClick={() => handleAssigneeChange('userA')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700"
                        >
                        To {users.userA.name}
                        </button>
                        <button 
                        onClick={() => handleAssigneeChange('userB')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700"
                        >
                        To {users.userB.name}
                        </button>
                        <button 
                        onClick={() => handleAssigneeChange('shared')}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700"
                        >
                        To Shared
                        </button>
                    </div>
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};