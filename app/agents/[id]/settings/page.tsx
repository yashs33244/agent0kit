'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Clock, Calendar, Repeat } from 'lucide-react';

interface Agent {
    id: string;
    agentId: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    status: string;
    schedule: string;
    envVars?: any;
}

interface CronSchedule {
    frequency: 'hourly' | 'daily' | 'weekly' | 'custom';
    hours: number[];
    daysOfWeek: number[];
    customCron: string;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function AgentSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);

    const [schedule, setSchedule] = useState<CronSchedule>({
        frequency: 'daily',
        hours: [9],
        daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
        customCron: '',
    });

    useEffect(() => {
        params.then(setUnwrappedParams);
    }, [params]);

    useEffect(() => {
        if (unwrappedParams) {
            fetchAgent();
        }
    }, [unwrappedParams]);

    const fetchAgent = async () => {
        if (!unwrappedParams) return;
        try {
            const res = await fetch(`/api/agents/${unwrappedParams.id}`);
            const data = await res.json();
            setAgent(data.agent);
            
            // Parse existing cron schedule
            if (data.agent.schedule) {
                parseCronSchedule(data.agent.schedule);
            }
        } catch (error) {
            console.error('Failed to fetch agent:', error);
        } finally {
            setLoading(false);
        }
    };

    const parseCronSchedule = (cron: string) => {
        // Basic cron parser
        const parts = cron.split(' ');
        if (parts.length === 5) {
            const [minute, hour, , , dayOfWeek] = parts;
            
            if (hour === '*') {
                setSchedule({ ...schedule, frequency: 'hourly' });
            } else if (dayOfWeek === '*') {
                const hours = hour.split(',').map(h => parseInt(h));
                setSchedule({ ...schedule, frequency: 'daily', hours });
            } else if (dayOfWeek !== '*') {
                const hours = hour.split(',').map(h => parseInt(h));
                const days = dayOfWeek.split(',').map(d => parseInt(d));
                setSchedule({ ...schedule, frequency: 'weekly', hours, daysOfWeek: days });
            } else {
                setSchedule({ ...schedule, frequency: 'custom', customCron: cron });
            }
        }
    };

    const generateCronExpression = (): string => {
        switch (schedule.frequency) {
            case 'hourly':
                return '0 * * * *';
            case 'daily':
                const dailyHours = schedule.hours.sort((a, b) => a - b).join(',');
                return `0 ${dailyHours} * * *`;
            case 'weekly':
                const weeklyHours = schedule.hours.sort((a, b) => a - b).join(',');
                const days = schedule.daysOfWeek.sort((a, b) => a - b).join(',');
                return `0 ${weeklyHours} * * ${days}`;
            case 'custom':
                return schedule.customCron;
            default:
                return '0 9 * * *';
        }
    };

    const handleSave = async () => {
        if (!agent || !unwrappedParams) return;
        
        setSaving(true);
        try {
            const cronExpression = generateCronExpression();
            
            const res = await fetch(`/api/agents/${unwrappedParams.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule: cronExpression }),
            });

            if (res.ok) {
                alert('Schedule saved successfully!');
                router.push(`/agents/${unwrappedParams.id}`);
            } else {
                alert('Failed to save schedule');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save schedule');
        } finally {
            setSaving(false);
        }
    };

    const toggleHour = (hour: number) => {
        if (schedule.hours.includes(hour)) {
            setSchedule({ ...schedule, hours: schedule.hours.filter(h => h !== hour) });
        } else {
            setSchedule({ ...schedule, hours: [...schedule.hours, hour] });
        }
    };

    const toggleDay = (day: number) => {
        if (schedule.daysOfWeek.includes(day)) {
            setSchedule({ ...schedule, daysOfWeek: schedule.daysOfWeek.filter(d => d !== day) });
        } else {
            setSchedule({ ...schedule, daysOfWeek: [...schedule.daysOfWeek, day] });
        }
    };

    const selectAllHours = () => {
        setSchedule({ ...schedule, hours: HOURS });
    };

    const clearAllHours = () => {
        setSchedule({ ...schedule, hours: [] });
    };

    const selectBusinessHours = () => {
        setSchedule({ ...schedule, hours: [9, 10, 11, 12, 13, 14, 15, 16, 17] });
    };

    const selectWeekdays = () => {
        setSchedule({ ...schedule, daysOfWeek: [1, 2, 3, 4, 5] });
    };

    const selectWeekend = () => {
        setSchedule({ ...schedule, daysOfWeek: [0, 6] });
    };

    const selectAllDays = () => {
        setSchedule({ ...schedule, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <p className="text-destructive mb-4">Agent not found</p>
                    <button
                        onClick={() => router.push('/agents')}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                    >
                        Back to Agents
                    </button>
                </div>
            </div>
        );
    }

    const cronExpression = generateCronExpression();

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => router.push(`/agents/${unwrappedParams?.id}`)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Agent
                </button>

                <div className="bg-card border border-border rounded-lg p-8 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="text-5xl">{agent.icon}</div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-1">{agent.name}</h1>
                            <p className="text-muted-foreground">Schedule Settings</p>
                        </div>
                    </div>
                </div>

                {/* Frequency Selector */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                        <Repeat size={20} />
                        Frequency
                    </h2>
                    <div className="grid grid-cols-4 gap-3">
                        {(['hourly', 'daily', 'weekly', 'custom'] as const).map((freq) => (
                            <button
                                key={freq}
                                onClick={() => setSchedule({ ...schedule, frequency: freq })}
                                className={`px-4 py-3 rounded-lg border transition-all ${
                                    schedule.frequency === freq
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-background text-foreground hover:border-primary/50'
                                }`}
                            >
                                <div className="font-medium capitalize">{freq}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hours Selection */}
                {schedule.frequency !== 'hourly' && schedule.frequency !== 'custom' && (
                    <div className="bg-card border border-border rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Clock size={20} />
                                Select Hours ({schedule.hours.length} selected)
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectBusinessHours}
                                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-all"
                                >
                                    Business Hours
                                </button>
                                <button
                                    onClick={selectAllHours}
                                    className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-all"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={clearAllHours}
                                    className="px-3 py-1 text-sm bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                            {HOURS.map((hour) => {
                                const isSelected = schedule.hours.includes(hour);
                                const displayHour = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
                                
                                return (
                                    <button
                                        key={hour}
                                        onClick={() => toggleHour(hour)}
                                        className={`aspect-square p-2 rounded-lg border text-sm font-medium transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted'
                                        }`}
                                        title={displayHour}
                                    >
                                        {hour}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground">
                            Selected hours: {schedule.hours.length === 0 ? 'None' : schedule.hours.sort((a, b) => a - b).map(h => {
                                return h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;
                            }).join(', ')}
                        </div>
                    </div>
                )}

                {/* Days of Week Selection */}
                {schedule.frequency === 'weekly' && (
                    <div className="bg-card border border-border rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Calendar size={20} />
                                Select Days ({schedule.daysOfWeek.length} selected)
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectWeekdays}
                                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-all"
                                >
                                    Weekdays
                                </button>
                                <button
                                    onClick={selectWeekend}
                                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-all"
                                >
                                    Weekend
                                </button>
                                <button
                                    onClick={selectAllDays}
                                    className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-all"
                                >
                                    All Days
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-3">
                            {DAYS_OF_WEEK.map((day) => {
                                const isSelected = schedule.daysOfWeek.includes(day.value);
                                
                                return (
                                    <button
                                        key={day.value}
                                        onClick={() => toggleDay(day.value)}
                                        className={`p-4 rounded-lg border transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted'
                                        }`}
                                    >
                                        <div className="text-xs font-medium mb-1">{day.short}</div>
                                        <div className="text-xs opacity-80">{day.label}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Custom Cron */}
                {schedule.frequency === 'custom' && (
                    <div className="bg-card border border-border rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-foreground mb-4">Custom Cron Expression</h2>
                        <input
                            type="text"
                            value={schedule.customCron}
                            onChange={(e) => setSchedule({ ...schedule, customCron: e.target.value })}
                            placeholder="0 9 * * * (minute hour day month weekday)"
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="mt-3 text-sm text-muted-foreground">
                            Format: minute hour day month weekday
                            <br />
                            Example: <code className="px-2 py-1 bg-muted rounded">0 9,12,18 * * 1-5</code> (9 AM, 12 PM, 6 PM on weekdays)
                        </p>
                    </div>
                )}

                {/* Preview */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Schedule Preview</h2>
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <div className="font-mono text-lg text-primary mb-3">{cronExpression}</div>
                        <div className="text-sm text-muted-foreground">
                            {schedule.frequency === 'hourly' && 'Runs every hour'}
                            {schedule.frequency === 'daily' && `Runs daily at: ${schedule.hours.sort((a, b) => a - b).map(h => {
                                return h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;
                            }).join(', ')}`}
                            {schedule.frequency === 'weekly' && (
                                <>
                                    Runs on {schedule.daysOfWeek.sort((a, b) => a - b).map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')} at {schedule.hours.sort((a, b) => a - b).map(h => {
                                        return h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`;
                                    }).join(', ')}
                                </>
                            )}
                            {schedule.frequency === 'custom' && 'Custom cron expression'}
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(`/agents/${unwrappedParams?.id}`)}
                        className="flex-1 px-6 py-3 border border-border rounded-lg text-foreground hover:bg-muted transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || (schedule.frequency !== 'custom' && schedule.hours.length === 0)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save Schedule'}
                    </button>
                </div>
            </div>
        </div>
    );
}

