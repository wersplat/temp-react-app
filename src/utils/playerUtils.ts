import type { PlayerPosition } from '../services/supabase';

/**
 * Converts a player position to its abbreviation (e.g., "Point Guard" -> "PG")
 */
export const getPositionAbbreviation = (position: PlayerPosition | null): string => {
  if (!position) return '';
  return position
    .split(' ')
    .map((word: string) => word[0].toUpperCase())
    .join('');
};

/**
 * Gets the appropriate Tailwind CSS class for a player position
 */
export const getPositionClass = (position: PlayerPosition | null): string => {
  const baseClass = 'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium';
  
  if (!position) return `${baseClass} bg-gray-100 text-gray-600`;
  
  const positionColors: Record<string, string> = {
    'QB': 'bg-blue-100 text-blue-800',
    'RB': 'bg-green-100 text-green-800',
    'WR': 'bg-yellow-100 text-yellow-800',
    'TE': 'bg-purple-100 text-purple-800',
    'K': 'bg-red-100 text-red-800',
    'DEF': 'bg-gray-800 text-white',
    'D/ST': 'bg-gray-800 text-white',
    'Point Guard': 'bg-blue-100 text-blue-800',
    'Shooting Guard': 'bg-green-100 text-green-800',
    'Small Forward': 'bg-yellow-100 text-yellow-800',
    'Power Forward': 'bg-purple-100 text-purple-800',
    'Center': 'bg-red-100 text-red-800',
    'Guard': 'bg-blue-100 text-blue-800',
    'Forward': 'bg-green-100 text-green-800',
    'Utility': 'bg-purple-100 text-purple-800',
    'Flex': 'bg-gray-100 text-gray-800',
  };
  
  return `${baseClass} ${positionColors[position] || 'bg-gray-100 text-gray-600'}`;
};
