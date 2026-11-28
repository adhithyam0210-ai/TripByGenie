import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';

export interface ActivityItem {
  id: string | number;
  description: string;
  created_at: string;
  action?: string;
  performed_by?: string;
}

interface ActivityLogListProps {
  activities?: ActivityItem[];
  title?: string;
  emptyText?: string;
  initialCount?: number;
}

export const ActivityLogList: React.FC<ActivityLogListProps> = ({
  activities = [],
  title = 'Activity & Audit Trail:',
  emptyText = 'No recorded activity on this enquiry yet.',
  initialCount = 1
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const total = activities?.length || 0;
  const hasMore = total > initialCount;
  const visibleActivities = isExpanded ? activities : activities.slice(0, initialCount);
  const hiddenCount = total - initialCount;

  return (
    <div className="pt-3 border-t border-[#EFE7DA]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#082C43] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {title}
        </span>
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-[#0070E0] hover:text-[#005bb8] hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <span>Close</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>More ({hiddenCount} more)</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {total === 0 ? (
          <p className="text-slate-400 py-2.5 text-center text-xs italic">{emptyText}</p>
        ) : (
          visibleActivities.map((act) => (
            <div
              key={act.id}
              className="p-2.5 rounded-xl bg-slate-50/90 hover:bg-slate-50 border border-slate-200/90 text-xs transition-colors"
            >
              <span className="font-semibold text-[#082C43] block leading-snug">{act.description}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {act.created_at
                  ? new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                  : 'Recent'}
              </span>
            </div>
          ))
        )}
      </div>

      {hasMore && isExpanded && (
        <div className="text-right pt-2">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <span>Close</span>
            <ChevronUp className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
