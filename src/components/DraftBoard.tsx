import { useDraft } from '../context/DraftContext/useDraft';
import type { Team } from '../services/supabase';
import DraftHeader from './DraftHeader';
import DraftPicksTable from './DraftPicksTable';

interface DraftBoardProps {
  currentTeam: Team | undefined;
  currentPick: number;
  timeLeft: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onResetDraft: () => void;
  isAdmin: boolean;
}

const DraftBoard = ({
  currentTeam,
  currentPick,
  timeLeft,
  isPaused,
  onTogglePause,
  onResetDraft,
  isAdmin
}: DraftBoardProps) => {
  const { teams, draftPicks } = useDraft();
  const totalPicks = draftPicks.length;
  const remainingPicks = teams.length * 16 - totalPicks;

  return (
    <div className="space-y-8">
      <DraftHeader
        currentTeam={currentTeam}
        currentPick={currentPick}
        timeLeft={timeLeft}
        isPaused={isPaused}
        isAdmin={isAdmin}
        totalPicks={totalPicks}
        remainingPicks={remainingPicks}
        onTogglePause={onTogglePause}
        onResetDraft={onResetDraft}
      />
      
      <DraftPicksTable 
        draftPicks={draftPicks}
        teams={teams}
      />
    </div>
  );
};

export default DraftBoard;
