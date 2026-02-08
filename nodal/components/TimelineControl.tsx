import React, { useState } from 'react';
import { LayoutDashboard, Clock, ChevronUp, ChevronDown, BookOpen } from 'lucide-react';
import { Phase } from '../types';

interface TimelineControlProps {
  phases: Phase[];
  activePhaseId: string | 'overview';
  onPhaseSelect: (id: string | 'overview') => void;
  language: 'original' | 'en';
}

const TimelineControl: React.FC<TimelineControlProps> = ({ phases, activePhaseId, onPhaseSelect, language }) => {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // Helper to get text based on current language
  const getText = (obj: any, field: string) => {
    const key = language === 'en' ? `${field}_en` : `${field}_original`;
    // Fallback to basic field if localized key is missing
    return obj[key] || obj[field] || "";
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 flex flex-col items-center gap-3">
      
      {/* Active Phase Detail Card (Persistent Popup) */}
      {activePhaseId !== 'overview' && (
        <div className={`w-full max-w-2xl bg-nodal-card/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom ${isSummaryExpanded ? 'max-h-[60vh]' : 'max-h-14'}`}>
          {phases.map((phase) => {
            if (phase.phase_id !== activePhaseId) return null;
            return (
              <div key={phase.phase_id} className="flex flex-col h-full">
                {/* Card Header */}
                <div 
                  className="px-5 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                >
                   <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                        <BookOpen size={16} />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {getText(phase, 'phase_name')}
                        </h3>
                        {/* Always show Summary label or hint that it is clickable */}
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">
                             {isSummaryExpanded ? 'Summary' : 'Click to expand summary'}
                        </p>
                      </div>
                   </div>
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setIsSummaryExpanded(!isSummaryExpanded);
                     }}
                     className="text-gray-400 hover:text-white transition-colors p-1"
                   >
                     {isSummaryExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                   </button>
                </div>

                {/* Card Body - Scrollable Text */}
                <div className={`px-5 py-4 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${isSummaryExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                    {getText(phase, 'summary')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline Strip */}
      <div className="bg-nodal-card/90 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-2 overflow-x-auto custom-scrollbar w-full max-w-full">
        
        {/* Overview Button */}
        <button
          onClick={() => {
            onPhaseSelect('overview');
            setIsSummaryExpanded(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${
            activePhaseId === 'overview'
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard size={16} />
          <span className="text-sm font-bold">Story Overview</span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-1 flex-shrink-0"></div>

        {/* Phase Buttons */}
        <div className="flex gap-2 items-center">
          {phases.map((phase, index) => {
             const isActive = activePhaseId === phase.phase_id;
             return (
               <button
                 key={phase.phase_id}
                 onClick={() => {
                   onPhaseSelect(phase.phase_id);
                   setIsSummaryExpanded(false); // Default to collapsed
                 }}
                 className={`group relative flex flex-col items-start px-4 py-2 rounded-xl transition-all min-w-[140px] max-w-[200px] border flex-shrink-0 ${
                   isActive 
                     ? 'bg-white/10 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                     : 'border-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200'
                 }`}
               >
                 <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                   <Clock size={12} className={isActive ? 'text-blue-400' : ''} />
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
  );
};

export default TimelineControl;