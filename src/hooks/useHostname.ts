export type AppMode = 'crm' | 'app';

export function useAppMode(): AppMode {
  const hostname = window.location.hostname;
  if (hostname.startsWith('crm.')) return 'crm';
  return 'app';
}
