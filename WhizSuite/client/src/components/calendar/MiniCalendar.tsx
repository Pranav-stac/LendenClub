'use client';

import { useState, useMemo } from 'react';
import styles from './MiniCalendar.module.css';

interface MiniCalendarProps {
    events?: { date: Date; type: string }[];
    onDateSelect?: (date: Date) => void;
}

export function MiniCalendar({ events = [], onDateSelect }: MiniCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Padding for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, date: null });
        }
        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                date: new Date(year, month, i)
            });
        }
        return days;
    }, [currentDate]);

    const hasEvent = (date: Date | null) => {
        if (!date) return false;
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return events.some(e => {
            const eventDate = new Date(e.date);
            const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
            return eventDateStr === dateStr;
        });
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        return date.toDateString() === new Date().toDateString();
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    return (
        <div className={styles.miniCalendar}>
            <div className={styles.header}>
                <button onClick={prevMonth} className={styles.navBtn}>‹</button>
                <span className={styles.monthTitle}>{monthName} {currentDate.getFullYear()}</span>
                <button onClick={nextMonth} className={styles.navBtn}>›</button>
            </div>
            <div className={styles.weekHeaders}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className={styles.daysGrid}>
                {daysInMonth.map((d, i) => (
                    <div
                        key={i}
                        className={`${styles.dayCell} ${d.day ? styles.activeDay : ''} ${isToday(d.date) ? styles.today : ''}`}
                        onClick={() => d.date && onDateSelect?.(d.date)}
                    >
                        {d.day}
                        {hasEvent(d.date) && <span className={styles.eventDot} />}
                    </div>
                ))}
            </div>
        </div>
    );
}
