// Branch Selector Component - Untuk memilih cabang aktif di Header
import React, { useState, useRef, useEffect } from 'react';
import { useBranch, Branch } from '../../lib/BranchContext';
import { ChevronDown, Check, Building2, MapPin } from 'lucide-react';

interface BranchSelectorProps {
  className?: string;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({ className = '' }) => {
  const { branches, activeBranch, changeBranch, isLoading } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if no branches or only one branch
  if (isLoading || branches.length === 0) {
    return null;
  }

  const handleSelect = (branch: Branch) => {
    changeBranch(branch);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
      >
        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <div className="text-left">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium block leading-tight">
            Cabang Aktif
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
            {activeBranch?.name || 'Pilih Cabang'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pilih Cabang</p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch)}
                className={`w-full px-3 py-2 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  activeBranch?.id === branch.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  branch.isMain 
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {branch.name}
                    </span>
                    {branch.isMain && (
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded uppercase">
                        Pusat
                      </span>
                    )}
                  </div>
                  {branch.address && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{branch.address}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    {branch.code}
                  </p>
                </div>
                {activeBranch?.id === branch.id && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          
          {branches.length > 3 && (
            <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs text-slate-500 text-center">
                {branches.length} cabang tersedia
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchSelector;
