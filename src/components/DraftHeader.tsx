import React from 'react';
import type { Team } from '../services/supabase';
import { formatTime } from '../utils/formatTime';

interface DraftHeaderProps {
  currentTeam: Team | undefined;
  currentPick: number;
  timeLeft: number;
  isPaused: boolean;
  isAdmin: boolean;
  totalPicks: number;
  remainingPicks: number;
}

// Explicit return type for better type safety
type DraftHeaderComponent = (props: DraftHeaderProps) => React.JSX.Element;

export const DraftHeader: DraftHeaderComponent = ({
  currentTeam,
  currentPick,
  timeLeft,
  isPaused,
  isAdmin,
  totalPicks,
  remainingPicks,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-all duration-200 border border-neutral-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="uppercase tracking-wide text-primary-600 font-bold text-sm">Draft Board</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {totalPicks} picks made • {remainingPicks} players remaining
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="text-center">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Current Pick</div>
            <div className="text-2xl font-bold text-primary-700">#{currentPick}</div>
          </div>
          
          <div className="h-12 w-px bg-neutral-200"></div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">On the Clock</div>
            <div className="text-xl font-semibold text-neutral-800">{currentTeam?.name || 'Loading...'}</div>
          </div>
          
          <div className="h-12 w-px bg-neutral-200"></div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Time Remaining</div>
            <div className={`text-2xl font-mono font-bold ${
              timeLeft <= 10 ? 'text-accent-600' : 'text-primary-600'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DraftHeader;
