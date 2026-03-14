'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input';
import { calendarApi, CalendarEvent, postsApi, Post } from '@/lib/api/services';
import styles from '../dashboard.module.css';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'POST' as CalendarEvent['type'], startTime: '', endTime: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Next month days to fill grid (42 cells total for 6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();

      const [eventsRes, postsRes] = await Promise.all([
        calendarApi.getEvents(start, end),
        postsApi.getAll({ limit: 100 }) // Fetch posts too
      ]);

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data);
      }
      if (postsRes.success && postsRes.data) {
        const postsData = Array.isArray(postsRes.data) ? postsRes.data : (postsRes.data as any).data || [];
        setPosts(postsData);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const allCalendarItems = useMemo(() => {
    const items = events.map(e => ({
      ...e,
      calendarType: 'event',
      date: new Date(e.startDate)
    }));

    const postItems = posts.map(p => ({
      id: p.id,
      title: p.content.substring(0, 30) + (p.content.length > 30 ? '...' : ''),
      description: p.content,
      startDate: p.scheduledAt || p.createdAt,
      type: 'POST' as const,
      calendarType: 'post',
      post: p,
      date: new Date(p.scheduledAt || p.createdAt)
    }));

    return [...items, ...postItems];
  }, [events, posts]);

  const getEventsForDate = (date: Date) => {
    return allCalendarItems.filter(item => {
      return item.date.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, startTime: '09:00', endTime: '10:00' }));
    setShowModal(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !selectedDate) return;

    setIsSubmitting(true);
    try {
      const startDate = new Date(selectedDate);
      if (formData.startTime) {
        const [hours, minutes] = formData.startTime.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes));
      }

      let endDate: Date | undefined;
      if (formData.endTime) {
        endDate = new Date(selectedDate);
        const [hours, minutes] = formData.endTime.split(':');
        endDate.setHours(parseInt(hours), parseInt(minutes));
      }

      const response = await calendarApi.createEvent({
        title: formData.title,
        description: formData.description || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString(),
        type: formData.type,
      });

      if (response.success && response.data) {
        setEvents([...events, response.data]);
        setShowModal(false);
        setFormData({ title: '', description: '', type: 'POST', startTime: '', endTime: '' });
      }
    } catch (err: any) {
      console.error(err);
      // In a real app, show toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const goToToday = () => setCurrentDate(new Date());

  const typeColors: Record<string, string> = {
    POST: 'var(--primary)',
    MEETING: 'var(--info)',
    DEADLINE: 'var(--warning)',
    APPROVAL: 'var(--success)',
    OTHER: 'var(--text-secondary)',
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Workspace Calendar</h1>
          <p className={styles.pageSubtitle}>Manage content and schedules across all brands</p>
        </div>
        <div className={styles.pageActions}>
          <Button variant="secondary" onClick={goToToday}>Today</Button>
          <Button variant="primary" shine onClick={() => { setSelectedDate(new Date()); setShowModal(true); }}>
            + Add New
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ padding: 'var(--space-6)' }}>
          {/* Calendar Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <button
                onClick={prevMonth}
                style={{ background: 'var(--surface-active)', border: 'none', padding: '8px', borderRadius: '50%', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                ←
              </button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={nextMonth}
                style={{ background: 'var(--surface-active)', border: 'none', padding: '8px', borderRadius: '50%', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                →
              </button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant={view === 'month' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('month')}>Month</Button>
              <Button variant={view === 'week' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('week')}>Week</Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} style={{ background: 'var(--surface)', padding: 'var(--space-3)', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {day}
              </div>
            ))}

            {/* Calendar Cells */}
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  style={{
                    minHeight: '120px',
                    background: isCurrentMonth ? 'var(--surface)' : 'var(--surface-active)',
                    padding: 'var(--space-2)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isCurrentMonth ? 'var(--surface)' : 'var(--surface-active)'}
                >
                  <div style={{
                    textAlign: 'right',
                    marginBottom: 'var(--space-2)',
                    color: isToday ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isToday ? '800' : '400'
                  }}>
                    {date.getDate()}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: event.calendarType === 'post'
                            ? (event.post?.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)')
                            : `color-mix(in srgb, ${typeColors[event.type] || 'gray'} 15%, transparent)`,
                          color: event.calendarType === 'post'
                            ? (event.post?.status === 'PUBLISHED' ? '#22c55e' : '#3b82f6')
                            : typeColors[event.type] || 'var(--text-primary)',
                          borderLeft: `2px solid ${event.calendarType === 'post' ? (event.post?.status === 'PUBLISHED' ? '#22c55e' : '#3b82f6') : (typeColors[event.type] || 'gray')}`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowDetailModal(true);
                        }}
                      >
                        {event.calendarType === 'post' && (
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                            {event.post?.platforms?.slice(0, 2).map((pp: any, i: number) => (
                              <span key={i} style={{ fontSize: '10px' }}>
                                {pp.platform?.name.toLowerCase().includes('instagram') ? '📸' :
                                  pp.platform?.name.toLowerCase().includes('facebook') ? '📘' :
                                    pp.platform?.name.toLowerCase().includes('twitter') ? '🐦' : '📝'}
                              </span>
                            ))}
                          </div>
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.calendarType === 'post' ? `[${event.post?.brand?.name?.substring(0, 4)}] ${event.title}` : event.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Event">
        <form onSubmit={handleCreateEvent} style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Title"
              placeholder="Post title or event name"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEvent['type'] })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-active)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="POST">Post</option>
                  <option value="MEETING">Meeting</option>
                  <option value="DEADLINE">Deadline</option>
                  <option value="APPROVAL">Approval</option>
                </select>
              </div>

              <Input
                label="Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>

            <Input
              label="Description"
              placeholder="Add details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedEvent?.calendarType === 'post' ? 'Scheduled Post' : 'Event Details'}
      >
        <div style={{ padding: 'var(--space-6)' }}>
          {selectedEvent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: selectedEvent.calendarType === 'post'
                    ? (selectedEvent.post?.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)')
                    : `rgba(var(--primary-rgb), 0.1)`,
                  color: selectedEvent.calendarType === 'post'
                    ? (selectedEvent.post?.status === 'PUBLISHED' ? '#22c55e' : '#3b82f6')
                    : 'var(--primary)',
                }}>
                  {selectedEvent.calendarType === 'post' ? selectedEvent.post?.status : selectedEvent.type}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {new Date(selectedEvent.startDate).toLocaleString()}
                </div>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{selectedEvent.title}</h2>

              <div style={{
                background: 'var(--surface-active)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius)',
                fontSize: '1rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedEvent.description || 'No description provided.'}
              </div>

              {selectedEvent.calendarType === 'post' && selectedEvent.post && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Brand: </span>
                    <span style={{ fontWeight: '600' }}>{selectedEvent.post.brand?.name || 'Unknown'}</span>
                  </div>
                  {selectedEvent.post.mediaUrls?.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginTop: '8px' }}>
                      {selectedEvent.post.mediaUrls.map((url: string, i: number) => (
                        <img key={i} src={url} alt="Media" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px' }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                {selectedEvent.calendarType === 'post' && (
                  <Link href={`/brands/${selectedEvent.post?.brandId}/platforms/${selectedEvent.post?.platforms?.[0]?.platform?.name.toLowerCase() || 'instagram'}`}>
                    <Button variant="primary">Manage Brand</Button>
                  </Link>
                )}
                <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
