'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface AgentRun {
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    duration: number | null;
    response: string | null;
    toolsUsed: any;
    toolResults: any;
    error: string | null;
    triggerType: string;
    notifications: any[];
}

interface Agent {
    id: string;
    agentId: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    status: string;
    schedule: string;
    runs: AgentRun[];
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);
    const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());

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
        } catch (error) {
            console.error('Failed to fetch agent:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAgentStatus = async () => {
        if (!agent || !unwrappedParams) return;
        setActionLoading(true);
        try {
            const newStatus = agent.status === 'active' ? 'paused' : 'active';
            const res = await fetch(`/api/agents/${unwrappedParams.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                await fetchAgent();
            }
        } catch (error) {
            console.error('Failed to toggle agent:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const runAgentNow = async () => {
        if (!agent || !unwrappedParams) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/agents/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: unwrappedParams.id }),
            });

            if (res.ok) {
                setTimeout(fetchAgent, 2000);
            }
        } catch (error) {
            console.error('Failed to run agent:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleRunExpanded = (runId: string) => {
        setExpandedRuns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(runId)) {
                newSet.delete(runId);
            } else {
                newSet.add(runId);
            }
            return newSet;
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
            case 'success':
                return 'text-green-500';
            case 'paused':
            case 'running':
                return 'text-yellow-500';
            case 'error':
                return 'text-red-500';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="text-green-500" size={20} />;
            case 'running':
                return <Clock className="text-yellow-500 animate-spin" size={20} />;
            case 'error':
                return <XCircle className="text-red-500" size={20} />;
            default:
                return <AlertCircle className="text-gray-400" size={20} />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading agent...</p>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <XCircle className="text-red-500 mx-auto mb-4" size={48} />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Agent Not Found</h2>
                    <button
                        onClick={() => router.push('/agents')}
                        className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                    >
                        Back to Agents
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => router.push('/agents')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Agents
                </button>

                {/* Agent Info */}
                <div className="bg-card border border-border rounded-lg p-8 mb-8">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-6xl">{agent.icon}</div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">{agent.name}</h1>
                                <p className="text-muted-foreground mb-3">{agent.description}</p>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-block px-3 py-1 text-sm rounded-full border ${agent.status === 'active'
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        }`}>
                                        {agent.status.toUpperCase()}
                                    </span>
                                    <span className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary rounded-full">
                                        {agent.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={toggleAgentStatus}
                                disabled={actionLoading}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${agent.status === 'active'
                                    ? 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                                    : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                    }`}
                            >
                                {agent.status === 'active' ? <Pause size={20} /> : <Play size={20} />}
                                {agent.status === 'active' ? 'Pause' : 'Start'}
                            </button>
                            <button
                                onClick={runAgentNow}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all"
                            >
                                <Play size={20} />
                                Run Now
                            </button>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock size={18} />
                            <span className="font-medium">Schedule:</span>
                            <span className="font-mono text-primary">{agent.schedule}</span>
                        </div>
                    </div>
                </div>

                {/* Runs History */}
                <div className="bg-card border border-border rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Run History ({agent.runs.length})</h2>

                    {agent.runs.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="text-muted-foreground mx-auto mb-4" size={48} />
                            <p className="text-muted-foreground">No runs yet. Click "Run Now" to start!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {agent.runs.map((run) => {
                                const isExpanded = expandedRuns.has(run.id);
                                
                                return (
                                    <div
                                        key={run.id}
                                        className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all"
                                    >
                                        {/* Accordion Header */}
                                        <button
                                            onClick={() => toggleRunExpanded(run.id)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                {getStatusIcon(run.status)}
                                                <div className="text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-semibold ${getStatusColor(run.status)}`}>
                                                            {run.status.toUpperCase()}
                                                        </span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(run.startedAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                        <span className="px-2 py-0.5 bg-muted rounded text-xs">
                                                            {run.triggerType}
                                                        </span>
                                                        {run.duration && (
                                                            <span>{(run.duration / 1000).toFixed(2)}s</span>
                                                        )}
                                                        {run.toolsUsed && Array.isArray(run.toolsUsed) && run.toolsUsed.length > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{run.toolsUsed.length} tools used</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {isExpanded ? (
                                                <ChevronDown className="text-muted-foreground" size={20} />
                                            ) : (
                                                <ChevronRight className="text-muted-foreground" size={20} />
                                            )}
                                        </button>

                                        {/* Accordion Content */}
                                        {isExpanded && (
                                            <div className="border-t border-border p-6 bg-muted/20">
                                                {/* Tools Used */}
                                                {run.toolsUsed && Array.isArray(run.toolsUsed) && run.toolsUsed.length > 0 && (
                                                    <div className="mb-6">
                                                        <p className="text-sm font-semibold text-foreground mb-3">Tools Used:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {run.toolsUsed.map((tool: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium"
                                                                >
                                                                    {tool}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Response in Markdown */}
                                                {run.response && (
                                                    <div className="mb-6">
                                                        <p className="text-sm font-semibold text-foreground mb-3">Response:</p>
                                                        <div className="bg-background border border-border rounded-lg p-6">
                                                            <div className="prose prose-slate dark:prose-invert max-w-none
                                                                prose-headings:font-bold prose-headings:tracking-tight
                                                                prose-h1:text-3xl prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4
                                                                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                                                                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                                                                prose-p:my-4 prose-p:leading-7
                                                                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                                                prose-strong:font-bold prose-strong:text-foreground
                                                                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                                                                prose-pre:bg-muted prose-pre:border prose-pre:border-border
                                                                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                                                                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                                                                prose-li:my-2 prose-li:leading-7
                                                                prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:bg-muted/50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic
                                                                prose-table:w-full prose-table:border-collapse
                                                                prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
                                                                prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2
                                                                prose-hr:my-8 prose-hr:border-border
                                                                prose-img:rounded-lg prose-img:shadow-md">
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    rehypePlugins={[rehypeRaw]}
                                                                >
                                                                    {run.response}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Error */}
                                                {run.error && (
                                                    <div className="mb-6">
                                                        <p className="text-sm font-semibold text-red-500 mb-3">Error:</p>
                                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                                            <pre className="text-sm text-red-500 whitespace-pre-wrap font-mono">
                                                                {run.error}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Notifications */}
                                                {run.notifications && run.notifications.length > 0 && (
                                                    <div className="pt-4 border-t border-border">
                                                        <p className="text-sm font-semibold text-foreground mb-3">Notifications:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {run.notifications.map((notif: any) => (
                                                                <span
                                                                    key={notif.id}
                                                                    className={`px-3 py-1 text-sm rounded-full ${notif.status === 'sent'
                                                                        ? 'bg-green-500/10 text-green-500'
                                                                        : 'bg-red-500/10 text-red-500'
                                                                        }`}
                                                                >
                                                                    {notif.channel}: {notif.status}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
