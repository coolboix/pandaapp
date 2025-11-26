import React, { useEffect, useState, useMemo } from 'react';
import { Task, UserID, UserProfile, Assignee } from './types';
import { 
    subscribeToTasks, 
    subscribeToUsers, 
    addTask, 
    updateTask, 
    updateTasks, 
    deleteTask, 
    updateUser,
    generateId 
} from './services/storage';
import { TaskCard } from './components/TaskCard';
import { MagicInput } from './components/MagicInput';
import { UserConfig } from './components/UserConfig';
import { QuickTaskInput } from './components/QuickTaskInput';
import { Layers } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({
    userA: { id: 'userA', name: 'User A', themeColor: 'teal' },
    userB: { id: 'userB', name: 'User B', themeColor: 'rose' },
  });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Initial Load & Subscriptions
  useEffect(() => {
    const unsubscribeTasks = subscribeToTasks((newTasks) => {
        setTasks(newTasks);
    });

    const unsubscribeUsers = subscribeToUsers((newUsers) => {
        setUsers(newUsers);
    });

    return () => {
        unsubscribeTasks();
        unsubscribeUsers();
    };
  }, []);

  const handleTaskUpdate = (updatedTask: Task) => {
    updateTask(updatedTask);
  };

  const handleTaskAdd = (newTask: Task) => {
    // Add new task at the top (lowest order value)
    const minOrder = tasks.length > 0 ? Math.min(...tasks.map(t => t.order)) : 0;
    const taskWithOrder = { ...newTask, order: minOrder - 1000 };
    addTask(taskWithOrder);
  };

  const handleQuickAdd = (title: string, assignee: Assignee) => {
    const newTask: Task = {
      id: generateId(),
      title,
      status: 'todo',
      assignee,
      color: assignee === 'userA' ? '#99f6e4' : assignee === 'userB' ? '#fecdd3' : '#a5b4fc', 
      createdAt: Date.now(),
      order: 0 // Will be set correctly in handleTaskAdd
    };
    handleTaskAdd(newTask);
  };

  const handleTaskSoftDelete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) updateTask({ ...task, isDeleted: true });
  };

  const handleTaskRestore = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) updateTask({ ...task, isDeleted: false });
  };

  const handleTaskPermanentDelete = (id: string) => {
    deleteTask(id);
  };

  const handleUserUpdate = (id: UserID, name: string) => {
    const updatedUser = { ...users[id], name };
    // Optimistic update
    setUsers({ ...users, [id]: updatedUser });
    updateUser(updatedUser);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  // Handle dropping onto a specific Task Card (Insert before)
  const handleDropOnTask = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    
    if (draggedId === targetTaskId) {
        setDraggedTaskId(null);
        return;
    }

    const draggedTask = tasks.find(t => t.id === draggedId);
    const targetTask = tasks.find(t => t.id === targetTaskId);

    if (!draggedTask || !targetTask) {
        setDraggedTaskId(null);
        return;
    }

    const targetAssignee = targetTask.assignee;
    const groupTasks = tasks
        .filter(t => t.assignee === targetAssignee && !t.isDeleted)
        .sort((a, b) => a.order - b.order);

    const targetIndex = groupTasks.findIndex(t => t.id === targetTaskId);
    
    // Calculate new order logic
    // We only need to update the dragged task and the tasks in the target group to re-normalize orders
    // This is a simplified approach: Reassign orders for the entire target group + dragged task
    
    const newGroupList = groupTasks.filter(t => t.id !== draggedId);
    newGroupList.splice(targetIndex, 0, { ...draggedTask, assignee: targetAssignee });

    // Prepare batch update
    const updates: Task[] = [];
    newGroupList.forEach((t, index) => {
        const newOrder = index * 1000;
        if (t.order !== newOrder || t.assignee !== targetAssignee) {
            updates.push({ ...t, order: newOrder, assignee: targetAssignee });
        }
    });

    if (updates.length > 0) {
        updateTasks(updates);
    }
    setDraggedTaskId(null);
  };

  // Handle dropping onto the general column area (Append to end)
  const handleContainerDrop = (e: React.DragEvent, targetAssignee: Assignee) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    const draggedTask = tasks.find(t => t.id === draggedId);
    
    if (!draggedTask) {
        setDraggedTaskId(null);
        return;
    }

    // Find the max order in the target column
    const targetTasks = tasks.filter(t => t.assignee === targetAssignee && !t.isDeleted);
    const maxOrder = targetTasks.length > 0 ? Math.max(...targetTasks.map(t => t.order)) : 0;
    
    // Only update if assignee changes or we are moving to bottom of same list
    if (draggedTask.assignee !== targetAssignee || draggedTask.order < maxOrder) {
        updateTask({
            ...draggedTask,
            assignee: targetAssignee,
            order: maxOrder + 1000
        });
    }
    setDraggedTaskId(null);
  };

  // Helper for sorting
  const sortTasks = (taskList: Task[]) => {
      return taskList.sort((a, b) => {
          if (a.isDeleted !== b.isDeleted) return a.isDeleted ? 1 : -1;
          return a.order - b.order; 
      });
  }

  const sharedTasks = useMemo(() => sortTasks(tasks.filter(t => t.assignee === 'shared')), [tasks]);
  const userATasks = useMemo(() => sortTasks(tasks.filter(t => t.assignee === 'userA')), [tasks]);
  const userBTasks = useMemo(() => sortTasks(tasks.filter(t => t.assignee === 'userB')), [tasks]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-purple-100 pb-20">
      
      {/* Header Area */}
      <header className="pt-12 pb-8 px-6 text-center bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20 bg-opacity-90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4 text-purple-600">
                <Layers size={32} />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">DuoTask</h1>
            </div>
            
            <UserConfig users={users} onUpdateUser={handleUserUpdate} />
            <MagicInput onAddTask={handleTaskAdd} users={users} />
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Layout: Shared Top, then Split Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Shared Section */}
            {sharedTasks.length > 0 && (
                <div className="col-span-1 md:col-span-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-slate-200 flex-grow"></div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Shared Workspace</h2>
                        <div className="h-px bg-slate-200 flex-grow"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sharedTasks.map(task => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                users={users}
                                onUpdate={handleTaskUpdate} 
                                onDelete={handleTaskSoftDelete}
                                onRestore={handleTaskRestore}
                                onPermanentDelete={handleTaskPermanentDelete}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDropOnTask}
                                className="bg-gradient-to-br from-white to-purple-50/30 border-purple-100"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* User A Column */}
            <div className="flex flex-col gap-4">
                <div 
                    className={`p-4 rounded-2xl bg-teal-50/50 border border-teal-100 min-h-[500px] transition-all duration-300 ${draggedTaskId ? 'ring-2 ring-teal-200 ring-offset-2' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleContainerDrop(e, 'userA')}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="font-bold text-teal-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                            {users.userA.name}'s Tasks
                        </h2>
                        <span className="text-xs font-semibold bg-white px-2 py-1 rounded-md text-teal-600 shadow-sm">
                            {userATasks.filter(t => t.status !== 'done' && !t.isDeleted).length} open
                        </span>
                    </div>

                    {/* Quick Add for User A */}
                    <QuickTaskInput 
                        assignee="userA" 
                        assigneeName={users.userA.name} 
                        themeColor="teal" 
                        onAdd={handleQuickAdd} 
                    />
                    
                    <div className="flex flex-col gap-3 min-h-[200px]">
                        {userATasks.length === 0 ? (
                            <EmptyState name={users.userA.name} />
                        ) : (
                            userATasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    users={users}
                                    onUpdate={handleTaskUpdate} 
                                    onDelete={handleTaskSoftDelete}
                                    onRestore={handleTaskRestore}
                                    onPermanentDelete={handleTaskPermanentDelete}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDropOnTask}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* User B Column */}
            <div className="flex flex-col gap-4">
                <div 
                    className={`p-4 rounded-2xl bg-rose-50/50 border border-rose-100 min-h-[500px] transition-all duration-300 ${draggedTaskId ? 'ring-2 ring-rose-200 ring-offset-2' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleContainerDrop(e, 'userB')}
                >
                     <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="font-bold text-rose-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                            {users.userB.name}'s Tasks
                        </h2>
                        <span className="text-xs font-semibold bg-white px-2 py-1 rounded-md text-rose-600 shadow-sm">
                            {userBTasks.filter(t => t.status !== 'done' && !t.isDeleted).length} open
                        </span>
                    </div>

                    {/* Quick Add for User B */}
                    <QuickTaskInput 
                        assignee="userB" 
                        assigneeName={users.userB.name} 
                        themeColor="rose" 
                        onAdd={handleQuickAdd} 
                    />

                    <div className="flex flex-col gap-3 min-h-[200px]">
                        {userBTasks.length === 0 ? (
                             <EmptyState name={users.userB.name} />
                        ) : (
                            userBTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    users={users}
                                    onUpdate={handleTaskUpdate} 
                                    onDelete={handleTaskSoftDelete}
                                    onRestore={handleTaskRestore}
                                    onPermanentDelete={handleTaskPermanentDelete}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDropOnTask}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

const EmptyState: React.FC<{name: string}> = ({ name }) => (
    <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/50 pointer-events-none">
        <div className="text-slate-300 mb-2">
            <Layers size={24} opacity={0.5} />
        </div>
        <p className="text-slate-400 text-sm">Drop tasks here</p>
    </div>
);

export default App;