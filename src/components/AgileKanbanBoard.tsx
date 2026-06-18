import React, { useState } from 'react';
import { ClipboardList, Activity, CheckCircle, ShieldAlert, Clock, PlayCircle } from 'lucide-react';

interface Task {
  id: string;
  petId: string;
  name: string;
  details: string;
  serviceRequested: string;
  time: string;
  status: string;
  behavioralNotes?: string;
}

export default function AgileKanbanBoard({ 
  tasks, 
  onTaskSelect, 
  onTaskStatusChange 
}: { 
  tasks: Task[], 
  onTaskSelect: (task: Task) => void,
  onTaskStatusChange: (taskId: string, newStatus: string) => void
}) {
  const columns = [
    { id: 'scheduled', label: 'To Do (Backlog)', icon: <ClipboardList className="w-5 h-5 text-slate-500" /> },
    { id: 'in-progress', label: 'In Progress (Current Sprint)', icon: <Activity className="w-5 h-5 text-indigo-500" /> },
    { id: 'completed', label: 'Done (Completed)', icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> }
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onTaskStatusChange(taskId, statusId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-8">
      {columns.map(column => {
        const columnTasks = tasks.filter(t => 
            (column.id === 'scheduled' && (!t.status || t.status === 'scheduled')) ||
            t.status === column.id
        );
        
        return (
          <div 
            key={column.id} 
            className="flex flex-col h-full bg-slate-50/50 rounded-3xl border border-slate-200/60 p-4"
            onDrop={(e) => handleDrop(e, column.id)}
            onDragOver={handleDragOver}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                {column.icon}
                <h3 className="font-bold text-slate-800 tracking-tight">{column.label}</h3>
              </div>
              <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                {columnTasks.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 pb-4">
              {columnTasks.map(task => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskSelect(task)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group active:cursor-grabbing hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{task.name}</div>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <Clock className="w-3 h-3" /> {task.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-1">{task.details}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                    <span className="inline-flex text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {task.serviceRequested}
                    </span>
                    
                    {column.id === 'scheduled' && (
                        <button title="Start Task" className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <PlayCircle className="w-5 h-5" />
                        </button>
                    )}
                  </div>
                </div>
              ))}
              
              {columnTasks.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm font-medium">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
