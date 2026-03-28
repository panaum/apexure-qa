import { useState, useEffect, useRef, useCallback } from 'react';

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number;
  fills?: Array<{ type: string; color: { r: number; g: number; b: number; a: number } }>;
}

interface FigmaPayload {
  fileKey: string;
  pageName: string;
  nodes: FigmaNode[];
}

type FigmaStatus = 'idle' | 'waiting' | 'ready' | 'error';

export function useFigmaData() {
  const [figmaData, setFigmaData] = useState<FigmaPayload | null>(null);
  const [status, setStatus] = useState<FigmaStatus>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startWaiting = useCallback(() => {
    setStatus('waiting');
    setFigmaData(null);
    stopPolling();

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:3333/figma-data');
        if (!res.ok) throw new Error('Bridge not responding');
        const data = await res.json();
        if (data && data.nodes) {
          setFigmaData(data);
          setStatus('ready');
          stopPolling();
        }
      } catch {
        // Bridge not running or no data yet — keep polling
      }
    }, 1500);
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setFigmaData(null);
    setStatus('idle');
  }, [stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return { figmaData, status, startWaiting, reset };
}
