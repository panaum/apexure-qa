import { useState } from 'react';

export type SEORecommendationsStatus = 'idle' | 'loading' | 'done' | 'error';

export function useSEORecommendations() {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [status, setStatus] = useState<SEORecommendationsStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = async (seoResult: any) => {
    setStatus('loading');
    setError(null);
    setRecommendations(null);

    try {
      const response = await fetch('http://localhost:3334/seo-ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seoResult),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setStatus('done');
    } catch (err: any) {
      setError(err.message || 'Failed to generate SEO recommendations');
      setStatus('error');
    }
  };

  return { recommendations, status, error, generateRecommendations };
}
