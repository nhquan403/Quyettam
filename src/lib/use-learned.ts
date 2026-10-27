import { useLiveQuery } from 'dexie-react-hooks';
import { learnedItems } from './mastery';
import type { Item } from './questions';
import { useUnits } from './units';

/** Live list of phrases in units whose "Học" step is done, with their mastery. */
export function useLearned(): Item[] | undefined {
  const units = useUnits();
  return useLiveQuery(() => (units ? learnedItems(units) : undefined), [units]);
}
