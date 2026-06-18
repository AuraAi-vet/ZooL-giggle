import React from 'react';
import { User, Stethoscope, ShieldCheck, Scissors } from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (roleId: string) => void;
}

export default function RoleSelectionView({ onSelectRole }: RoleSelectionProps) {
  const roles = [
    { 
      id: 'role_owner_01', 
      title: 'Pet Parent', 
      desc: 'Access your pet\'s care ecosystem.',
      icon: <User className="w-6 h-6" />,
      color: 'text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-500 hover:bg-blue-100'
    },
    { 
      id: 'role_vet_02', 
      title: 'Clinician / Vet', 
      desc: 'Manage clinical SOAP notes and vitals.',
      icon: <Stethoscope className="w-6 h-6" />,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-100'
    },
    { 
      id: 'role_admin_03', 
      title: 'Clinic Admin', 
      desc: 'Oversee operations and master schedules.',
      icon: <ShieldCheck className="w-6 h-6" />,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-100'
    },
    { 
      id: 'role_service_04', 
      title: 'Care Provider', 
      desc: 'Grooming, training, and boarding tasks.',
      icon: <Scissors className="w-6 h-6" />,
      color: 'text-orange-600 bg-orange-50 border-orange-200 hover:border-orange-500 hover:bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-extrabold text-3xl shadow-xl mb-4">
          Z
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome to ZooL</h1>
        <p className="text-slate-500 font-medium mt-1 text-center max-w-sm">
          Please select your operational role to configure your workspace.
        </p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 p-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className={`flex flex-col items-start text-left p-6 border rounded-2xl transition-all cursor-pointer group ${role.color}`}
            >
              <div className="mb-4 p-3 bg-white rounded-xl shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                {role.icon}
              </div>
              <span className="font-bold text-slate-900 text-lg">{role.title}</span>
              <span className="text-sm font-medium opacity-80 mt-1 text-slate-700">{role.desc}</span>
            </button>
          ))}
        </div>

      </div>

    </div>
  );
}
