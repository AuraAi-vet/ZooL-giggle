import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#FDFCFB]">
        <header className="bg-white/95 backdrop-blur-3xl border-b border-ruru-navy/10 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#F0EBE6] rounded-[1.25rem] animate-pulse" />
            <div className="w-32 h-6 bg-[#F0EBE6] rounded animate-pulse" />
          </div>
          <div className="w-8 h-8 bg-[#F0EBE6] rounded-full animate-pulse" />
        </header>`;

const replacement = `      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#FDFCFB]">
        <header className="bg-white/95 backdrop-blur-3xl border-b border-ruru-navy/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <ZooLLogo size="lg" className="opacity-50 grayscale transition-all duration-700" />
          </div>
          <div className="w-8 h-8 bg-[#F0EBE6] rounded-full animate-pulse" />
        </header>`;

// Use split and join to replace all occurrences
content = content.split(target).join(replacement);
fs.writeFileSync('src/App.tsx', content, 'utf8');
