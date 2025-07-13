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
  onTogglePause: () => void;
  onResetDraft: () => void;
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
  onTogglePause,
  onResetDraft,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Draft Board</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalPicks} picks made • {remainingPicks} players remaining
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Current Pick</div>
            <div className="text-2xl font-bold text-indigo-600">#{currentPick}</div>
          </div>
          
          <div className="h-12 w-px bg-gray-200"></div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">On the Clock</div>
            <div className="text-xl font-semibold">{currentTeam?.name || 'Loading...'}</div>
          </div>
          
          <div className="h-12 w-px bg-gray-200"></div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Time Remaining</div>
            <div className={`text-2xl font-mono ${
              timeLeft <= 10 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onTogglePause}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition-colors"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            {isAdmin && (
              <button
                onClick={onResetDraft}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium text-red-700 transition-colors"
              >
                Reset Draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DraftHeader;
