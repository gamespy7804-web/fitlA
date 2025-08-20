
export function getThemeForSport(sport: string): string {
  const lowerCaseSport = sport.toLowerCase();

  if (lowerCaseSport.includes('boxeo')) {
    return 'theme-boxing';
  }
  if (lowerCaseSport.includes('calistenia')) {
    return 'theme-calisthenics';
  }
   if (lowerCaseSport.includes('yoga') || lowerCaseSport.includes('pilates')) {
    return 'theme-yoga';
  }

  // Add more sport-to-theme mappings here
  // e.g., if (lowerCaseSport.includes('running')) return 'theme-running';

  return 'theme-default';
}
