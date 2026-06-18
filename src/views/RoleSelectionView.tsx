import { User, Stethoscope, ShieldCheck, Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import AnimatedLogo from '../components/AnimatedLogo';
import { useLanguage } from '../lib/i18n';

interface RoleSelectionProps {
  onSelectRole: (roleId: string) => void;
}

export default function RoleSelectionView({ onSelectRole }: RoleSelectionProps) {
  const { t } = useLanguage();

  const roles = [
    { 
      id: 'role_owner_01', 
      title: t('petParent') || 'Pet Parent', 
      desc: 'Access your pet\'s care ecosystem.',
      icon: <User className="w-6 h-6" />,
      color: 'text-blue-600 bg-blue-50/50 border-blue-200/50 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md hover:shadow-blue-500/10'
    },
    { 
      id: 'role_vet_02', 
      title: 'Clinician / Vet', 
      desc: 'Manage clinical SOAP notes and vitals.',
      icon: <Stethoscope className="w-6 h-6" />,
      color: 'text-emerald-600 bg-emerald-50/50 border-emerald-200/50 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-500/10'
    },
    { 
      id: 'role_admin_03', 
      title: 'Clinic Admin', 
      desc: 'Oversee operations and master schedules.',
      icon: <ShieldCheck className="w-6 h-6" />,
      color: 'text-indigo-600 bg-indigo-50/50 border-indigo-200/50 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md hover:shadow-indigo-500/10'
    },
    { 
      id: 'role_service_04', 
      title: 'Care Provider', 
      desc: 'Grooming, training, and boarding tasks.',
      icon: <Scissors className="w-6 h-6" />,
      color: 'text-orange-600 bg-orange-50/50 border-orange-200/50 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md hover:shadow-orange-500/10'
    }
  ];

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none mask-image-radial-gradient"></div>

      {/* Brand Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center mb-10 z-10">
        <AnimatedLogo size="lg" className="mb-6 drop-shadow-2xl" />
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">Welcome to ZooL</h1>
        <p className="text-slate-400 font-medium mt-3 text-center max-w-sm leading-relaxed">
          Please select your operational role to configure your workspace.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full max-w-3xl bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-700/50 p-10 z-10">
        
        <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <motion.button
              variants={itemVars}
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className={`relative overflow-hidden flex flex-col items-start text-left p-8 border rounded-[1.5rem] transition-all duration-300 cursor-pointer group bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 hover:shadow-xl hover:-translate-y-1`}
            >
              {/* Subtle hover gradient inside card */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className={`mb-5 p-3.5 rounded-2xl shadow-sm border border-white/10 group-hover:scale-110 transition-transform duration-500 relative z-10 ${role.color.split(' ')[0]} bg-slate-900/80`}>
                {role.icon}
              </div>
              <div className="flex justify-between items-center w-full relative z-10">
                <span className="font-bold text-white text-xl tracking-tight">{role.title}</span>
                {role.id !== 'role_owner_01' && (
                  <span className="text-[9px] font-black bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-md border border-cyan-500/20 uppercase tracking-widest">Verification Req.</span>
                )}
              </div>
              <span className="text-sm font-medium opacity-80 mt-2 text-slate-400 leading-relaxed relative z-10">{role.desc}</span>
            </motion.button>
          ))}
        </motion.div>

      </motion.div>

    </div>
  );
}
