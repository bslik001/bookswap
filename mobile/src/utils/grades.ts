export const GRADE_OPTIONS = [
  { value: '6e', label: '6e' },
  { value: '5e', label: '5e' },
  { value: '4e', label: '4e' },
  { value: '3e', label: '3e' },
  { value: '2nde', label: '2nde' },
  { value: '1ere', label: '1ere' },
  { value: 'Tle', label: 'Terminale' },
] as const;

// Sentinelle envoyee au serveur pour filtrer les niveaux hors liste standard.
export const OTHER_GRADE_VALUE = '__other__';
