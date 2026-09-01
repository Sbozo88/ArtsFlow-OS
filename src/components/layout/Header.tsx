import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search learners, groups..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-md text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-slate-200 cursor-pointer">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
            JD
          </div>
          <div className="text-sm font-medium text-slate-700">Jane Doe</div>
        </div>
      </div>
    </header>
  );
}
