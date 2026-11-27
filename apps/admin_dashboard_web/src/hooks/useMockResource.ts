import { useCallback, useEffect, useState } from 'react';

export function useMockResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loader()
      .then((value) => { if (active) setData(value); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'تعذر تحميل البيانات التجريبية.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loader, revision]);

  return { data, loading, error, reload };
}
