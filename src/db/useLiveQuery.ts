import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';

export function useLiveQuery<T>(
  querier: () => Promise<T> | T,
  deps: readonly unknown[] = [],
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const subscription = liveQuery(querier).subscribe({
      next: (result) => {
        if (active) setValue(result);
      },
      error: (err) => {
        console.error('[PrepCIT] Dexie liveQuery error:', err);
      },
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
