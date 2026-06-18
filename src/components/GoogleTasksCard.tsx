import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ListTodo, 
  Loader2, 
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { 
  listGoogleTaskLists, 
  listGoogleTasks, 
  createGoogleTask, 
  updateGoogleTask, 
  deleteGoogleTask,
  createGoogleTaskList,
  GoogleTaskList,
  GoogleTask 
} from '../services/googleTasksService';

interface GoogleTasksCardProps {
  googleToken: string | null;
  onGoogleTasksAuth: () => Promise<string | null>;
}

export function GoogleTasksCard({ googleToken, onGoogleTasksAuth }: GoogleTasksCardProps) {
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<GoogleTask | null>(null);

  // Fetch task lists on token available
  const loadTaskLists = async (token: string) => {
    setIsLoadingLists(true);
    try {
      const lists = await listGoogleTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0) {
        // Default to first list or previous selection if it still exists
        const exists = lists.find(l => l.id === selectedListId);
        if (!exists) {
          setSelectedListId(lists[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load task lists.');
    } finally {
      setIsLoadingLists(false);
    }
  };

  // Fetch tasks for the selected list
  const loadTasks = async (token: string, listId: string) => {
    if (!listId) return;
    setIsLoadingTasks(true);
    try {
      const fetchedTasks = await listGoogleTasks(token, listId);
      setTasks(fetchedTasks);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load tasks.');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (googleToken) {
      loadTaskLists(googleToken);
    }
  }, [googleToken]);

  useEffect(() => {
    if (googleToken && selectedListId) {
      loadTasks(googleToken, selectedListId);
    }
  }, [googleToken, selectedListId]);

  const handleConnect = async () => {
    setIsActionInProgress(true);
    try {
      await onGoogleTasksAuth();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleRefresh = () => {
    if (googleToken && selectedListId) {
      loadTasks(googleToken, selectedListId);
      toast.success('Tasks updated');
    }
  };

  const handleCreateTaskList = async () => {
    if (!googleToken || !newListName.trim()) return;
    
    // Explicit confirmation for mutating operations as required
    const confirmed = window.confirm(`Create a new task list named "${newListName.trim()}" in Google Tasks?`);
    if (!confirmed) return;

    setIsActionInProgress(true);
    try {
      const newList = await createGoogleTaskList(googleToken, newListName.trim());
      setTaskLists(prev => [...prev, newList]);
      setSelectedListId(newList.id);
      setNewListName('');
      setShowNewListForm(false);
      toast.success('Task list created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task list');
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleToken || !selectedListId || !newTaskTitle.trim()) return;

    // Explicit confirmation for creating standard tasks
    const confirmed = window.confirm(`Add the task "${newTaskTitle.trim()}" to Google Tasks?`);
    if (!confirmed) return;

    setIsActionInProgress(true);
    try {
      const taskBody: { title: string; notes?: string; due?: string } = {
        title: newTaskTitle.trim()
      };
      if (newTaskNotes.trim()) {
        taskBody.notes = newTaskNotes.trim();
      }
      if (newTaskDue) {
        // Google Tasks expects RFC 3339 formatted date-time with zero time fields, e.g. "2026-05-23T00:00:00.000Z"
        taskBody.due = new Date(newTaskDue).toISOString();
      }

      const newTask = await createGoogleTask(googleToken, selectedListId, taskBody);
      setTasks(prev => [newTask, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      setShowAddForm(false);
      toast.success('Task added to Google Tasks!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add task.');
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleToggleTask = async (task: GoogleTask) => {
    if (!googleToken || !selectedListId) return;

    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    const actionLabel = newStatus === 'completed' ? 'complete' : 'uncomplete';

    // Explicit confirmation for mutating task status
    const confirmed = window.confirm(`Mark "${task.title}" as ${newStatus === 'completed' ? 'Completed' : 'Incomplete'} in Google Tasks?`);
    if (!confirmed) return;

    setIsActionInProgress(true);
    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const updated = await updateGoogleTask(googleToken, selectedListId, task.id, {
        id: task.id,
        status: newStatus
      });
      // Replace with exactly what came from backend
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      toast.success(`Task marked as ${actionLabel}!`);
    } catch (err: any) {
      // Revert optimism on error
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      toast.error(err.message || 'Failed to update task.');
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleDeleteTask = (task: GoogleTask) => {
    setTaskToDelete(task);
  };

  const commitDeleteTask = async (task: GoogleTask) => {
    if (!googleToken || !selectedListId) return;

    setIsActionInProgress(true);
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== task.id));

    try {
      await deleteGoogleTask(googleToken, selectedListId, task.id);
      toast.success('Task deleted from Google Tasks.');
    } catch (err: any) {
      // Revert on error
      setTasks(previousTasks);
      toast.error(err.message || 'Failed to delete task.');
    } finally {
      setIsActionInProgress(false);
    }
  };

  const activeList = taskLists.find(l => l.id === selectedListId);

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-ruru-teal/10 relative overflow-hidden">
      {/* Background soft teal wash */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-ruru-teal/5 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-ruru-navy/5 text-ruru-navy rounded-[1.25rem] flex items-center justify-center">
            <ListTodo size={24} className="text-ruru-navy" />
          </div>
          <div>
            <h3 className="text-xl font-brand text-ruru-navy font-bold flex items-center gap-2">
              Google Tasks Integration
              {googleToken && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Connected" />}
            </h3>
            <p className="text-xs text-soft-ink/60 font-medium">Manage your clinical & pet priorities in real-time</p>
          </div>
        </div>

        {googleToken && (
          <button
            onClick={handleRefresh}
            disabled={isLoadingTasks || isLoadingLists || isActionInProgress}
            className="self-start sm:self-center p-2 rounded-xl border border-ruru-teal/15 text-ruru-navy/60 hover:text-ruru-navy hover:bg-ruru-teal/5 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={14} className={cn((isLoadingTasks || isLoadingLists) && "animate-spin")} />
            Sync
          </button>
        )}
      </div>

      {/* Disconnected State */}
      {!googleToken ? (
        <div className="text-center py-8 px-4 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-ruru-teal/10 flex items-center justify-center text-ruru-teal mb-2">
            <ClipboardList size={32} />
          </div>
          <h4 className="text-base font-brand font-semibold text-ruru-navy">Keep Sync Across Devices</h4>
          <p className="text-xs text-soft-ink/70 max-w-sm leading-relaxed">
            Connect your Google account to automatically import and export lists, set vaccine checkups, or maintain tasks with live Google Tasks synchronization.
          </p>
          
          <button
            onClick={handleConnect}
            disabled={isActionInProgress}
            className="px-6 py-3.5 bg-ruru-navy text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-ruru-navy/90 transition-all shadow-md flex items-center gap-2"
          >
            {isActionInProgress ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ExternalLink size={16} />
            )}
            Connect Google Tasks
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* List Selector Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <button
                onClick={() => setShowListDropdown(!showListDropdown)}
                className="w-full bg-[#F5F5F0] hover:bg-slate-100/80 border border-soft-blue/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-ruru-navy flex items-center justify-between transition-all"
              >
                <span className="truncate">📁 Task List: {activeList?.title || 'Loading lists...'}</span>
                <ChevronDown size={16} className={cn("text-ruru-navy/50 transition-transform", showListDropdown && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showListDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowListDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute left-0 right-0 mt-2 bg-white border border-ruru-navy/10 rounded-2xl p-2 shadow-2xl z-20 space-y-1"
                    >
                      {taskLists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => {
                            setSelectedListId(list.id);
                            setShowListDropdown(false);
                          }}
                          className={cn(
                            "w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all",
                            selectedListId === list.id 
                              ? "bg-ruru-navy text-white" 
                              : "hover:bg-ruru-teal/5 text-ruru-navy/80 hover:text-ruru-navy"
                          )}
                        >
                          {list.title}
                        </button>
                      ))}
                      <div className="border-t border-slate-100 pt-2 px-1">
                        <button
                          onClick={() => {
                            setShowNewListForm(true);
                            setShowListDropdown(false);
                          }}
                          className="w-full text-left p-2 rounded-lg text-[10px] uppercase tracking-wider font-extrabold text-ruru-teal hover:bg-ruru-teal/5 transition-all text-center"
                        >
                          + Create New List
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-5 py-3.5 bg-ruru-teal/10 hover:bg-ruru-teal/20 text-ruru-navy rounded-2xl text-xs font-black uppercase tracking-widest border border-ruru-teal/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>

          {/* New List Form Dialog */}
          <AnimatePresence>
            {showNewListForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#A8A29E]">New List Title</span>
                  <button onClick={() => setShowNewListForm(false)} className="text-[10px] font-bold text-rose-500 hover:underline">Cancel</button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-ruru-navy focus:outline-none"
                    disabled={isActionInProgress}
                  />
                  <button
                    onClick={handleCreateTaskList}
                    disabled={isActionInProgress || !newListName.trim()}
                    className="px-4 py-2.5 bg-ruru-navy text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-ruru-navy/90 transition-all disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Task Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                onSubmit={handleAddTask}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#F5F5F0]/60 border border-soft-blue/10 p-5 rounded-3xl space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="E.g., Renew vaccine appointment"
                    className="w-full bg-white border border-[#E9E9E0] rounded-xl px-4 py-3 text-sm font-bold text-ruru-navy focus:outline-none"
                    disabled={isActionInProgress}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={newTaskDue}
                      onChange={(e) => setNewTaskDue(e.target.value)}
                      className="w-full bg-white border border-[#E9E9E0] rounded-xl px-4 py-2.5 text-sm font-medium text-ruru-navy focus:outline-none"
                      disabled={isActionInProgress}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Details/Notes (Optional)</label>
                    <input
                      type="text"
                      value={newTaskNotes}
                      onChange={(e) => setNewTaskNotes(e.target.value)}
                      placeholder="E.g., Contact clinic 24h before"
                      className="w-full bg-white border border-[#E9E9E0] rounded-xl px-4 py-2.5 text-sm font-medium text-ruru-navy focus:outline-none"
                      disabled={isActionInProgress}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-soft-ink hover:bg-slate-50 transition"
                    disabled={isActionInProgress}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isActionInProgress || !newTaskTitle.trim()}
                    className="px-5 py-2.5 bg-ruru-navy text-white rounded-xl text-xs font-black uppercase tracking-wider shadow hover:bg-ruru-navy/90 transition-all disabled:opacity-50"
                  >
                    Add to Google Tasks
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Task Feed Area */}
          <div className="space-y-3 min-h-[120px] relative">
            {(isLoadingTasks || isLoadingLists) ? (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 py-12 rounded-2xl">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="text-ruru-teal animate-spin" />
                  <p className="text-xs text-soft-ink font-semibold italic">Syncing with Google Tasks...</p>
                </div>
              </div>
            ) : null}

            {tasks.length === 0 ? (
              <div className="text-center py-10 text-sm text-[#A8A29E] font-medium border border-dashed border-slate-100 rounded-[2rem] bg-slate-50/20">
                No tasks inside this Google list. Select or create another list to get started!
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {tasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div 
                      key={task.id} 
                      className={cn(
                        "flex items-center gap-3.5 bg-white p-4.5 rounded-[1.5rem] border border-ruru-navy/5 shadow-sm group hover:border-ruru-teal/20 transition-all hover:shadow-md",
                        isCompleted && "bg-slate-50/50"
                      )}
                    >
                      <button 
                        onClick={() => handleToggleTask(task)} 
                        disabled={isActionInProgress}
                        className={cn("shrink-0 transition-colors", isCompleted ? "text-emerald-500" : "text-[#A8A29E] hover:text-ruru-navy")}
                        title={isCompleted ? "Mark incomplete" : "Mark complete"}
                      >
                        {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-bold truncate leading-snug", isCompleted ? "text-[#A8A29E] line-through font-normal" : "text-ruru-navy")}>
                          {task.title}
                        </p>
                        
                        {task.notes && (
                          <p className={cn("text-xs mt-0.5 line-clamp-1 leading-normal text-soft-ink/75 font-medium", isCompleted && "text-[#A8A29E]/70")}>
                            {task.notes}
                          </p>
                        )}
                        
                        {task.due && (
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-black uppercase text-[#A8A29E] tracking-wider font-mono">
                            <CalendarIcon size={11} /> 
                            <span>Due: {new Date(task.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => handleDeleteTask(task)}
                        disabled={isActionInProgress}
                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100/80 disabled:opacity-30"
                        title="Delete task from Google Tasks"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog Component */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with fade-in */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskToDelete(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            
            {/* Modal Body with spring animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-[2rem] max-w-md w-full p-6 shadow-2xl border border-rose-500/10 z-10 relative overflow-hidden"
            >
              {/* Top accent accent line */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500" />
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={24} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-ruru-navy font-brand">Delete Task?</h4>
                  <p className="text-xs text-soft-ink/75 mt-1 leading-relaxed">
                    Are you sure you want to permanently delete <strong className="font-semibold text-ruru-navy">"{taskToDelete.title}"</strong> from Google Tasks? This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setTaskToDelete(null)}
                  className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-soft-ink hover:text-ruru-navy rounded-xl text-xs font-bold transition-all"
                  disabled={isActionInProgress}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const task = taskToDelete;
                    setTaskToDelete(null);
                    await commitDeleteTask(task);
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/10"
                  disabled={isActionInProgress}
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
