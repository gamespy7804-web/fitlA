

export function getThemeForSport(sport: string): string {
  if (!sport) return 'theme-default';
  const lowerCaseSport = sport.toLowerCase();

  if (lowerCaseSport.includes('boxeo') || lowerCaseSport.includes('boxing')) {
    return 'theme-boxing';
  }
  if (lowerCaseSport.includes('calistenia') || lowerCaseSport.includes('calisthenics')) {
    return 'theme-calisthenics';
  }
   if (lowerCaseSport.includes('yoga') || lowerCaseSport.includes('pilates')) {
    return 'theme-yoga';
  }

  // Add more sport-to-theme mappings here
  // e.g., if (lowerCaseSport.includes('running')) return 'theme-running';

  return 'theme-default';
}
