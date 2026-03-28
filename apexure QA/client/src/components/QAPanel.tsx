import React, { useState } from 'react';
import { useFigmaData } from '../hooks/useFigmaData';
import { useComparison } from '../hooks/useComparison';

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
  } as React.CSSProperties,
  title: {
    fontSize: '1.25rem',
    fontWeight: '700' as const,
    color: '#f1f5f9',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  inputRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  input: {
    flex: 1,
    minWidth: '240px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    fontSize: '0.875rem',
    outline: 'none',
  } as React.CSSProperties,
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600' as const,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
  } as React.CSSProperties,
  disabledButton: {
    backgroundColor: '#334155',
    color: '#64748b',
    cursor: 'not-allowed',
  } as React.CSSProperties,
  secondaryButton: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #475569',
  } as React.CSSProperties,
  statusBox: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  summaryBar: {
    display: 'flex',
    gap: '24px',
    padding: '14px 18px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.875rem',
    fontWeight: '600' as const,
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.8125rem',
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    borderBottom: '1px solid #334155',
    color: '#94a3b8',
    fontWeight: '600' as const,
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #1e293b',
    color: '#e2e8f0',
  } as React.CSSProperties,
  spinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid #334155',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  } as React.CSSProperties,
  errorText: {
    color: '#f87171',
    fontSize: '0.875rem',
    padding: '12px 16px',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(248, 113, 113, 0.2)',
  } as React.CSSProperties,
};

const statusBadge = (status: 'fail' | 'warn' | 'pass') => {
  const map = {
    fail: { emoji: '🔴', color: '#f87171' },
    warn: { emoji: '🟡', color: '#fbbf24' },
    pass: { emoji: '🟢', color: '#34d399' },
  };
  const { emoji, color } = map[status];
  return (
    <span style={{ color, fontWeight: '600' }}>
      {emoji} {status.toUpperCase()}
    </span>
  );
};

export default function QAPanel() {
  const [liveUrl, setLiveUrl] = useState('');
  const { figmaData, status: figmaStatus, startWaiting, reset } = useFigmaData();
  const { result, status: compareStatus, error: compareError, runComparison } = useComparison();

  const canCompare = figmaStatus === 'ready' && liveUrl.trim().length > 0 && compareStatus !== 'running';

  const handleRunComparison = () => {
    if (canCompare) {
      runComparison(liveUrl.trim());
    }
  };

  const figmaStatusContent = () => {
    switch (figmaStatus) {
      case 'idle':
        return (
          <div style={{ ...styles.statusBox, backgroundColor: 'rgba(148, 163, 184, 0.1)', border: '1px solid #334155', color: '#94a3b8' }}>
            ⏸️ Figma not connected — click "Connect Figma" to start
          </div>
        );
      case 'waiting':
        return (
          <div style={{ ...styles.statusBox, backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd' }}>
            <span style={styles.spinner} /> &nbsp; Waiting — run the Antigravity plugin in Figma now...
          </div>
        );
      case 'ready':
        return (
          <div style={{ ...styles.statusBox, backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399' }}>
            ✅ Connected — {figmaData?.nodes.length} nodes from "{figmaData?.pageName}"
          </div>
        );
      case 'error':
        return (
          <div style={{ ...styles.statusBox, backgroundColor: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171' }}>
            ❌ Connection error
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.container} id="qa-panel">
        <div style={styles.title}>
          🔍 Figma vs Live QA Comparison
        </div>

        {figmaStatusContent()}

        <div style={styles.inputRow}>
          <input
            id="live-url-input"
            type="text"
            placeholder="Enter live URL to compare (e.g. https://example.com)"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            style={styles.input}
          />
          {figmaStatus === 'idle' || figmaStatus === 'error' ? (
            <button
              id="connect-figma-btn"
              onClick={startWaiting}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              Connect Figma
            </button>
          ) : figmaStatus === 'ready' ? (
            <button
              id="reset-figma-btn"
              onClick={reset}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Reset
            </button>
          ) : null}
          <button
            id="run-comparison-btn"
            onClick={handleRunComparison}
            disabled={!canCompare}
            style={{
              ...styles.button,
              ...(canCompare ? styles.primaryButton : styles.disabledButton),
            }}
          >
            {compareStatus === 'running' ? 'Running...' : 'Run Comparison'}
          </button>
        </div>

        {compareStatus === 'running' && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
            <div style={{ ...styles.spinner, width: '32px', height: '32px', marginBottom: '12px', display: 'inline-block' }} />
            <p>Analyzing live page with Playwright...</p>
          </div>
        )}

        {compareError && (
          <div style={styles.errorText}>
            ❌ {compareError}
          </div>
        )}

        {result && compareStatus === 'done' && (
          <>
            <div style={styles.summaryBar}>
              <div style={{ ...styles.summaryItem, color: '#f1f5f9' }}>
                📊 Checked: <strong>{result.total}</strong>
              </div>
              <div style={{ ...styles.summaryItem, color: '#34d399' }}>
                ✅ Passed: <strong>{result.passed}</strong>
              </div>
              <div style={{ ...styles.summaryItem, color: '#f87171' }}>
                ❌ Failed: <strong>{result.failed}</strong>
              </div>
              <div style={{ ...styles.summaryItem, color: '#fbbf24' }}>
                ⚠️ Warned: <strong>{result.warned}</strong>
              </div>
              <div style={{ ...styles.summaryItem, color: '#94a3b8' }}>
                🕐 {new Date(result.checkedAt).toLocaleTimeString()}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Node Name</th>
                    <th style={styles.th}>Property</th>
                    <th style={styles.th}>Figma Value</th>
                    <th style={styles.th}>Live Value</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.mismatches.map((m, i) => (
                    <tr key={`${m.nodeId}-${m.property}-${i}`} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(15, 23, 42, 0.5)' }}>
                      <td style={{ ...styles.td, fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nodeName}</td>
                      <td style={{ ...styles.td, color: '#93c5fd' }}>{m.property}</td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '0.75rem' }}>{m.figmaValue}</td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '0.75rem' }}>{m.liveValue}</td>
                      <td style={styles.td}>{statusBadge(m.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
