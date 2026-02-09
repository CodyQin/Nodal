import React, { useState } from 'react';
import { LayoutDashboard, Clock, ChevronUp, ChevronDown, BookOpen, Calendar } from 'lucide-react';
import { Phase } from '../types';

interface TimelineControlProps {
  phases: Phase[];
  activePhaseId: string | 'overview';
  onPhaseSelect: (id: string | 'overview') => void;
  language: 'original' | 'en';
  theme: 'dark' | 'light';
}

const TimelineControl: React.FC<TimelineControlProps> = ({ phases, activePhaseId, onPhaseSelect, language, theme }) => {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const isDark = theme === 'dark';

  const getText = (obj: any, field: string) => {
    const key = language === 'en' ? `${field}_en` : `${field}_original`;
    return obj[key] || obj[field] || "";
  };

  // Classes
  const cardBg = isDark ? "bg-slate-800/95 border-white/20" : "bg-white/95 border-slate-200";
  const headerHover = isDark ? "hover:bg-white/10" : "hover:bg-slate-100";
  const textTitle = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-gray-400" : "text-slate-500";
  const textBody = isDark ? "text-gray-200" : "text-slate-700";
  const separator = isDark ? "border-white/10" : "border-slate-200";

  const timelineBg = isDark ? "bg-slate-800/90 border-white/10" : "bg-white/90 border-slate-200";
  const btnActive = "bg-blue-600 text-white shadow-lg scale-105";
  const btnInactive = isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100";
  
  const phaseActive = isDark 
    ? "bg-white/10 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
    : "bg-blue-50 border-blue-400 text-blue-900 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
  
  const phaseInactive = isDark
    ? "border-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200"
    : "border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-800";

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 flex flex-col items-center gap-3">
      
      {/* Active Phase Detail Card */}
      {activePhaseId !== 'overview' && (
        <div className={`w-full max-w-2xl backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom ${cardBg} ${isSummaryExpanded ? 'max-h-[60vh]' : 'max-h-14'}`}>
          {phases.map((phase) => {
            if (phase.phase_id !== activePhaseId) return null;
            return (
              <div key={phase.phase_id} className="flex flex-col h-full">
                {/* Card Header */}
                <div 
                  className={`px-5 py-3 border-b flex items-center justify-between cursor-pointer transition-colors ${separator} ${headerHover}`}
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                >
                   <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                        <BookOpen size={16} />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className={`text-sm font-bold leading-tight ${textTitle}`}>
                          {getText(phase, 'phase_name')}
                        </h3>
                        <p className={`text-[10px] uppercase tracking-widest font-semibold mt-0.5 ${textSub}`}>
                             {isSummaryExpanded ? 'Summary' : 'Click to expand summary'}
                        </p>
                      </div>
                   </div>
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setIsSummaryExpanded(!isSummaryExpanded);
                     }}
                     className={`transition-colors p-1 ${textSub} hover:text-blue-500`}
                   >
                     {isSummaryExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                   </button>
                </div>

                {/* Card Body */}
                <div className={`px-5 py-4 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${isSummaryExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-line ${textBody}`}>
                    {getText(phase, 'summary')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline Strip Container */}
      <div className={`flex flex-col w-full max-w-full backdrop-blur-md border rounded-2xl p-2 shadow-2xl ${timelineBg}`}>
        
        {/* Timeline Header */}
        <div className="flex items-center gap-2 mb-2 px-1">
           <Calendar size={14} className={isDark ? "text-blue-400" : "text-blue-600"} />
           <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-slate-500"}`}>Timeline</span>
        </div>

        {/* Scrollable Strip */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {/* Overview Button */}
          <button
            onClick={() => {
              onPhaseSelect('overview');
              setIsSummaryExpanded(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${
              activePhaseId === 'overview' ? btnActive : btnInactive
            }`}
          >
            <LayoutDashboard size={16} />
            <span className="text-sm font-bold">Story Overview</span>
          </button>

          <div className={`w-px h-8 mx-1 flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>

          {/* Phase Buttons */}
          <div className="flex gap-2 items-center">
            {phases.map((phase, index) => {
              const isActive = activePhaseId === phase.phase_id;
              return (
                <button
                  key={phase.phase_id}
                  onClick={() => {
                    onPhaseSelect(phase.phase_id);
                    setIsSummaryExpanded(false); 
                  }}
                  className={`group relative flex flex-col items-start px-4 py-2 rounded-xl transition-all min-w-[140px] max-w-[200px] border flex-shrink-0 ${
                    isActive ? phaseActive : phaseInactive
                  }`}
                >
                  <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1 opacity-70`}>
                    <Clock size={12} className={isActive ? 'text-blue-500' : ''} />
                    Phase {index + 1}
                  </div>
                  <div className="text-sm font-medium truncate w-full text-left" title={getText(phase, 'phase_name')}>
                    {getText(phase, 'phase_name')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineControl;