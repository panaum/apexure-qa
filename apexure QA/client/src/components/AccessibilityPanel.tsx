import React, { useState } from 'react';
import { useAccessibility, AccessibilityIssue } from '../hooks/useAccessibility';

type FilterType = 'all' | 'fail' | 'warn' | 'pass';

const AccessibilityPanel: React.FC = () => {
  const { result, status, error, runCheck } = useAccessibility();
  const [url, setUrl] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const handleRunCheck = () => {
    if (url.trim()) {
      runCheck(url.trim());
    }
  };

  const filteredIssues: AccessibilityIssue[] = result
    ? filter === 'all'
      ? result.issues
      : result.issues.filter((i) => i.status === filter)
    : [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'color-contrast': return '🎨 Contrast';
      case 'image-alt': return '🖼️ Alt Text';
      case 'font-size': return '🔤 Font Size';
      default: return type;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return { background: '#f87171', color: '#1e1e1e' };
      case 'serious': return { background: '#fb923c', color: '#1e1e1e' };
      case 'moderate': return { background: '#fbbf24', color: '#1e1e1e' };
      case 'minor': return { background: '#94a3b8', color: '#1e1e1e' };
      default: return { background: '#94a3b8', color: '#1e1e1e' };
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'fail': return '🔴 FAIL';
      case 'warn': return '🟡 WARN';
      case 'pass': return '🟢 PASS';
      default: return s;
    }
  };

  const containerStyle: React.CSSProperties = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '24px',
  };

  const hasSuccessBanner =
    result &&
    status === 'done' &&
    result.summary.failed === 0 &&
    result.summary.warned === 0;

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
          ♿ WCAG 2.1 AA Accessibility Checker
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
          Checks colour contrast, missing alt text, and font size readability
        </p>
      </div>

      {/* INPUT ROW */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="https://yoursite.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRunCheck()}
          style={{
            flex: 1,
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '0.875rem',
            color: '#ffffff',
            outline: 'none',
          }}
        />
        <button
          onClick={handleRunCheck}
          disabled={status === 'running' || !url.trim()}
          style={{
            background: status === 'running' || !url.trim() ? '#475569' : '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: status === 'running' || !url.trim() ? 'not-allowed' : 'pointer',
            opacity: status === 'running' || !url.trim() ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {status === 'running' ? 'Scanning...' : 'Run Check'}
        </button>
      </div>

      {/* LOADING */}
      {status === 'running' && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #334155',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'a11y-spin 1s linear infinite',
            }}
          />
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            Scanning page for accessibility issues...
          </p>
          <style>{`@keyframes a11y-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ERROR */}
      {status === 'error' && error && (
        <div
          style={{
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid #f87171',
            borderRadius: '8px',
            padding: '16px',
            color: '#f87171',
            fontSize: '0.875rem',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* SUCCESS BANNER */}
      {hasSuccessBanner && (
        <div
          style={{
            background: '#064e3b',
            border: '1px solid #065f46',
            borderRadius: '8px',
            padding: '16px',
            color: '#34d399',
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          ✅ This page passes WCAG 2.1 AA — No accessibility issues detected
        </div>
      )}

      {/* RESULTS */}
      {status === 'done' && result && (
        <>
          {/* SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Total', value: result.summary.total, color: '#ffffff' },
              { label: 'Passed', value: result.summary.passed, color: '#34d399' },
              { label: 'Failed', value: result.summary.failed, color: '#f87171' },
              { label: 'Warned', value: result.summary.warned, color: '#fbbf24' },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: card.color }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </div>
              </div>
            ))}
          </div>

          {/* FILTER BAR */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['all', 'fail', 'warn', 'pass'] as FilterType[]).map((f) => {
              const isActive = filter === f;
              const labelMap: Record<FilterType, string> = {
                all: `All (${result.issues.length})`,
                fail: `Failed (${result.summary.failed})`,
                warn: `Warnings (${result.summary.warned})`,
                pass: `Passed (${result.summary.passed})`,
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    background: isActive ? '#3b82f6' : '#1e293b',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {labelMap[f]}
                </button>
              );
            })}
          </div>

          {/* ISSUES TABLE */}
          {filteredIssues.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#94a3b8',
                fontSize: '0.95rem',
              }}
            >
              ✅ No issues found for this filter
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    {['Type', 'Impact', 'Description', 'Element', 'WCAG', 'Status'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          color: '#94a3b8',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr
                      key={issue.id}
                      style={{
                        borderBottom: '1px solid #1e293b',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Type */}
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#ffffff' }}>
                        {getTypeIcon(issue.type)}
                      </td>

                      {/* Impact */}
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            ...getImpactColor(issue.impact),
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {issue.impact}
                        </span>
                      </td>

                      {/* Description */}
                      <td
                        style={{
                          padding: '10px 12px',
                          color: '#e2e8f0',
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={issue.description}
                      >
                        {issue.description.length > 80
                          ? issue.description.substring(0, 80) + '...'
                          : issue.description}
                      </td>

                      {/* Element */}
                      <td
                        style={{
                          padding: '10px 12px',
                          fontFamily: 'monospace',
                          color: '#93c5fd',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.75rem',
                        }}
                        title={issue.element}
                      >
                        {issue.element.length > 40
                          ? issue.element.substring(0, 40) + '...'
                          : issue.element}
                      </td>

                      {/* WCAG */}
                      <td
                        style={{
                          padding: '10px 12px',
                          color: '#94a3b8',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {issue.wcagCriteria}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {getStatusIcon(issue.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccessibilityPanel;
