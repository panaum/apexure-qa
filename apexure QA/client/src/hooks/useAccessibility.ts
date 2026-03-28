import { useState } from 'react';

// ---- Types ----

export interface AccessibilityIssue {
  id: string;
  type: 'color-contrast' | 'image-alt' | 'font-size';
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  element: string;
  wcagCriteria: string;
  status: 'fail' | 'warn' | 'pass';
}

export interface AccessibilitySummary {
  total: number;
  passed: number;
  failed: number;
  warned: number;
}

export interface AccessibilityResult {
  url: string;
  checkedAt: string;
  summary: AccessibilitySummary;
  issues: AccessibilityIssue[];
}

export type AccessibilityStatus = 'idle' | 'running' | 'done' | 'error';

// ---- Hook ----

export function useAccessibility() {
  const [result, setResult] = useState<AccessibilityResult | null>(null);
  const [status, setStatus] = useState<AccessibilityStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const runCheck = async (url: string) => {
    setStatus('running');
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3334/accessibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: AccessibilityResult = await response.json();
      setResult(data);
      setStatus('done');
    } catch (err: any) {
      setError(err.message || 'Accessibility check failed');
      setStatus('error');
    }
  };

  return { result, status, error, runCheck };
}
