'use client';

import styles from './AnalyticsChart.module.css';

interface DataPoint {
  label: string;
  value: number;
}

interface AnalyticsChartProps {
  title: string;
  data: DataPoint[];
  type?: 'bar' | 'line';
  color?: string;
}

export function AnalyticsChart({ title, data, type = 'bar', color = 'var(--primary-500)' }: AnalyticsChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className={styles.chart}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.chartArea}>
        {type === 'bar' && (
          <div className={styles.barChart}>
            {data.map((point, idx) => (
              <div key={idx} className={styles.barItem}>
                <div className={styles.barContainer}>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${(point.value / maxValue) * 100}%`,
                      background: color,
                    }}
                  />
                </div>
                <span className={styles.barLabel}>{point.label}</span>
              </div>
            ))}
          </div>
        )}
        {type === 'line' && (
          <svg className={styles.lineChart} viewBox="0 0 100 50" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={data.map((point, idx) => 
                `${(idx / (data.length - 1)) * 100},${50 - (point.value / maxValue) * 45}`
              ).join(' ')}
            />
            <polyline
              fill={`${color}20`}
              stroke="none"
              points={`0,50 ${data.map((point, idx) => 
                `${(idx / (data.length - 1)) * 100},${50 - (point.value / maxValue) * 45}`
              ).join(' ')} 100,50`}
            />
          </svg>
        )}
      </div>
    </div>
  );
}






