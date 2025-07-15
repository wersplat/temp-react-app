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
    'Point Guard': 'bg-blue-100 text-blue-800',
    'Shooting Guard': 'bg-green-100 text-green-800',
    'Lock': 'bg-yellow-100 text-yellow-800',
    'Power Forward': 'bg-purple-100 text-purple-800',
    'Center': 'bg-brand-red-100 text-brand-red-800',
  };
  
  return `${baseClass} ${positionColors[position] || 'bg-gray-100 text-gray-600'}`;
};
