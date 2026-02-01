/**
 * Get initials from display name or email
 * Returns 1-2 uppercase letters
 */
export function getInitials(name: string): string {
  if (!name) return '?';

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    // Single word: take first 1-2 characters
    return words[0].slice(0, 2).toUpperCase();
  }
  // Multiple words: take first letter of first two words
  return words
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

/**
 * Get deterministic color from user ID
 * Same user always gets same color across sessions
 */
export function getAvatarColor(userId: string): string {
  const colors = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];

  // Simple hash: sum character codes
  const hash = userId.split('').reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );

  return colors[hash % colors.length];
}
