import { useState, useCallback } from 'react';

interface Mismatch {
  nodeId: string;
  nodeName: string;
  property: string;
  figmaValue: string;
  liveValue: string;
  status: 'fail' | 'warn' | 'pass';
}

interface CompareResult {
  pageName: string;
  url: string;
  checkedAt: string;
  total: number;
  passed: number;
  failed: number;
  warned: number;
  mismatches: Mismatch[];
}

type CompareStatus = 'idle' | 'running' | 'done' | 'error';

export function useComparison() {
  const [result, setResult] = useState<CompareResult | null>(null);
  const [status, setStatus] = useState<CompareStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const runComparison = useCallback(async (liveUrl: string) => {
    setStatus('running');
    setResult(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:3334/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: liveUrl }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const data: CompareResult = await res.json();
      setResult(data);
      setStatus('done');
    } catch (err: any) {
      setError(err.message || 'Comparison failed');
      setStatus('error');
    }
  }, []);

  return { result, status, error, runComparison };
}
