'use client';

import { useState, useMemo, useCallback } from 'react';
import styles from './CalendarView.module.css';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'post' | 'meeting' | 'deadline' | 'approval';
  platform?: string;
  platforms?: string[];
  platformCount?: number;
  status?: 'scheduled' | 'published' | 'draft';
  hasMedia?: boolean;
  mediaCount?: number;
  fullPost?: any;
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventReschedule?: (eventId: string, newDate: Date) => void;
  enableDragDrop?: boolean;
}

export function CalendarView({ 
  events = [], 
  onEventClick, 
  onDateClick, 
  onEventReschedule,
  enableDragDrop = true 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [currentDate]);

  // Memoize events by date for efficient lookups
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    console.log('CalendarView: Processing events', events.length, events.map(e => ({ id: e.id, date: e.date.toDateString() })));
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const dateKey = eventDate.toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    console.log('CalendarView: Events by date map', Array.from(map.entries()).map(([date, evts]) => ({ date, count: evts.length })));
    return map;
  }, [events]);

  const getEventsForDate = useCallback((date: Date) => {
    const dateKey = date.toDateString();
    return eventsByDate.get(dateKey) || [];
  }, [eventsByDate]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const goToToday = () => setCurrentDate(new Date());

  const typeColors: Record<string, string> = {
    post: 'var(--primary-500)',
    meeting: 'var(--info-base)',
    deadline: 'var(--warning-base)',
    approval: 'var(--success-base)',
  };

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (!enableDragDrop || event.status === 'published') {
      e.preventDefault();
      return; // Don't allow dragging published posts
    }
    
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    if (!enableDragDrop || !draggedEvent) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    if (!enableDragDrop || !draggedEvent) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Don't allow dropping on the same date
    const eventDate = new Date(draggedEvent.date);
    if (eventDate.toDateString() === date.toDateString()) {
      setDraggedEvent(null);
      setDragOverDate(null);
      return;
    }

    // Preserve the time from the original event, just change the date
    const newDate = new Date(date);
    newDate.setHours(eventDate.getHours());
    newDate.setMinutes(eventDate.getMinutes());
    newDate.setSeconds(eventDate.getSeconds());

    if (onEventReschedule && draggedEvent.id) {
      onEventReschedule(draggedEvent.id, newDate);
    }

    setDraggedEvent(null);
    setDragOverDate(null);
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <div className={styles.navigation}>
          <button onClick={prevMonth} className={styles.navBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 className={styles.title}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={nextMonth} className={styles.navBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div className={styles.actions}>
          <button onClick={goToToday} className={styles.todayBtn}>Today</button>
          <div className={styles.viewToggle}>
            <button onClick={() => setView('month')} className={view === 'month' ? styles.active : ''}>Month</button>
            <button onClick={() => setView('week')} className={view === 'week' ? styles.active : ''}>Week</button>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {dayNames.map(day => (
          <div key={day} className={styles.dayHeader}>{day}</div>
        ))}
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const dayEvents = getEventsForDate(date);
          return (
            <div
              key={idx}
              className={`${styles.day} ${!isCurrentMonth ? styles.otherMonth : ''} ${isToday(date) ? styles.today : ''} ${dragOverDate?.toDateString() === date.toDateString() ? styles.dragOver : ''}`}
              onClick={() => onDateClick?.(date)}
              onDragOver={(e) => handleDragOver(e, date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, date)}
            >
              <span className={styles.dayNumber}>{date.getDate()}</span>
              {dayEvents.slice(0, 3).map(event => {
                const eventTime = new Date(event.date);
                const timeStr = eventTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const statusColors: Record<string, string> = {
                  scheduled: 'var(--info-base)',
                  published: 'var(--success-base)',
                  draft: 'var(--warning-base)',
                };
                
                return (
                  <div
                    key={event.id}
                    className={`${styles.event} ${draggedEvent?.id === event.id ? styles.dragging : ''} ${enableDragDrop && event.status !== 'published' ? styles.draggable : ''}`}
                    style={{ 
                      '--event-color': typeColors[event.type] || typeColors.post,
                      '--status-color': statusColors[event.status || 'draft']
                    } as React.CSSProperties}
                    onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                    title={`${event.title} - ${timeStr}${event.platforms ? ` - ${event.platforms.join(', ')}` : ''}${enableDragDrop && event.status !== 'published' ? ' (Drag to reschedule)' : ''}`}
                    draggable={enableDragDrop && event.status !== 'published'}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onDragEnd={(e) => handleDragEnd(e)}
                  >
                    <div className={styles.eventContent}>
                      <div className={styles.eventHeader}>
                        <span className={styles.eventTime}>{timeStr}</span>
                        {event.status && (
                          <span className={styles.eventStatus} data-status={event.status}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>
                        )}
                      </div>
                      <div className={styles.eventTitle}>{event.title}</div>
                      <div className={styles.eventMeta}>
                        {event.platforms && event.platforms.length > 0 && (
                          <span className={styles.eventPlatforms}>
                            {event.platforms.slice(0, 2).map((p, i) => (
                              <span key={i} className={styles.platformBadge}>{p.charAt(0)}</span>
                            ))}
                            {event.platformCount && event.platformCount > 2 && (
                              <span className={styles.platformCount}>+{event.platformCount - 2}</span>
                            )}
                          </span>
                        )}
                        {event.hasMedia && (
                          <span className={styles.mediaIndicator} title={`${event.mediaCount || 0} media files`}>
                            📎 {event.mediaCount || 0}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {dayEvents.length > 3 && (
                <span className={styles.moreEvents}>+{dayEvents.length - 3} more</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


