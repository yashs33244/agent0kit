'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Settings, Trash2, Plus, Clock, Activity, CheckCircle2, XCircle } from 'lucide-react';

interface Agent {
    id: string;
    agentId: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    status: 'active' | 'paused' | 'error';
    schedule: string;
    createdAt: string;
    updatedAt: string;
    envVars?: any;
    runs?: any[];
}

export default function AgentsPage() {
    const router = useRouter();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch('/api/agents');
            const data = await res.json();
            setAgents(data.agents || []);
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
        setActionLoading(agentId);
        try {
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';
            const res = await fetch(`/api/agents/${agentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                await fetchAgents();
            }
        } catch (error) {
            console.error('Failed to toggle agent:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const runAgentNow = async (agentId: string) => {
        setActionLoading(agentId);
        try {
            const res = await fetch('/api/agents/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId }),
            });

            if (res.ok) {
                alert('Agent is running! Check the detail page for results.');
            }
        } catch (error) {
            console.error('Failed to run agent:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const deleteAgent = async (agentId: string) => {
        if (!confirm('Are you sure you want to delete this agent?')) return;

        setActionLoading(agentId);
        try {
            const res = await fetch(`/api/agents/${agentId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await fetchAgents();
            }
        } catch (error) {
            console.error('Failed to delete agent:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'paused':
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            case 'error':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading agents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            🤖 AI Agents Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Manage and monitor your automated agents
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all"
                    >
                        <Plus size={20} />
                        Create Agent
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Agents</h3>
                        <Activity className="text-primary" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{agents.length}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
                        <CheckCircle2 className="text-green-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                        {agents.filter(a => a.status === 'active').length}
                    </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Paused</h3>
                        <Pause className="text-gray-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                        {agents.filter(a => a.status === 'paused').length}
                    </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Errors</h3>
                        <XCircle className="text-red-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                        {agents.filter(a => a.status === 'error').length}
                    </p>
                </div>
            </div>

            {/* Agents Grid */}
            <div className="max-w-7xl mx-auto">
                {agents.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-border rounded-lg">
                        <p className="text-muted-foreground mb-4">No agents found</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                        >
                            Create Your First Agent
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((agent) => (
                            <div
                                key={agent.id}
                                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all cursor-pointer group"
                                onClick={() => router.push(`/agents/${agent.agentId}`)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-4xl">{agent.icon}</div>
                                        <div>
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                {agent.name}
                                            </h3>
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full border mt-1 ${getStatusColor(agent.status)}`}>
                                                {agent.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {agent.description}
                                </p>

                                {/* Schedule */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 bg-muted/50 px-3 py-2 rounded">
                                    <Clock size={14} />
                                    <span className="font-mono text-xs">{agent.schedule}</span>
                                </div>

                                {/* Category */}
                                <div className="mb-4">
                                    <span className="inline-block px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">
                                        {agent.category}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => toggleAgentStatus(agent.agentId, agent.status)}
                                        disabled={actionLoading === agent.agentId}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${agent.status === 'active'
                                            ? 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                                            : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                            }`}
                                    >
                                        {agent.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                                        {agent.status === 'active' ? 'Pause' : 'Start'}
                                    </button>
                                    <button
                                        onClick={() => runAgentNow(agent.agentId)}
                                        disabled={actionLoading === agent.agentId}
                                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                                    >
                                        Run Now
                                    </button>
                                    <button
                                        onClick={() => router.push(`/agents/${agent.agentId}/settings`)}
                                        className="p-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-all"
                                    >
                                        <Settings size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteAgent(agent.agentId)}
                                        disabled={actionLoading === agent.agentId}
                                        className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Agent Modal */}
            {showCreateModal && (
                <CreateAgentModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchAgents();
                    }}
                />
            )}
        </div>
    );
}

function CreateAgentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        agentId: '',
        name: '',
        description: '',
        icon: '🤖',
        category: 'Custom',
        schedule: '0 9 * * *',
        tools: [] as string[],
        prompt: '',
    });
    const [loading, setLoading] = useState(false);

    const availableTools = [
        { id: 'jobSearch', name: 'Job Search', description: 'Search for jobs with AI matching' },
        { id: 'websearch', name: 'Web Search', description: 'Search the web using Tavily' },
        { id: 'twitter', name: 'Twitter', description: 'Post tweets and interact with Twitter' },
        { id: 'github', name: 'GitHub', description: 'Search repositories and pull requests' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    envVars: {
                        tools: formData.tools,
                        prompt: formData.prompt,
                    },
                }),
            });

            if (res.ok) {
                onSuccess();
            } else {
                alert('Failed to create agent');
            }
        } catch (error) {
            console.error('Failed to create agent:', error);
            alert('Failed to create agent');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-foreground">Create New Agent</h2>
                    <p className="text-muted-foreground mt-1">Configure your custom AI agent</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Agent ID */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Agent ID <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.agentId}
                            onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                            placeholder="my-custom-agent"
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Agent Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="My Custom Agent"
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Icon & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
                            <input
                                type="text"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="🤖"
                                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Custom"
                                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Description <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What does this agent do?"
                            rows={3}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Schedule */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Cron Schedule <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.schedule}
                            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                            placeholder="0 9 * * * (Every day at 9 AM)"
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Use cron format: minute hour day month weekday
                        </p>
                    </div>

                    {/* Tools */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Tools
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {availableTools.map((tool) => (
                                <label
                                    key={tool.id}
                                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.tools.includes(tool.id)
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-background hover:border-primary/50'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.tools.includes(tool.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData({ ...formData, tools: [...formData.tools, tool.id] });
                                            } else {
                                                setFormData({ ...formData, tools: formData.tools.filter(t => t !== tool.id) });
                                            }
                                        }}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="font-medium text-foreground text-sm">{tool.name}</div>
                                        <div className="text-xs text-muted-foreground">{tool.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Prompt */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Agent Prompt <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            required
                            value={formData.prompt}
                            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                            placeholder="What should this agent do when it runs?"
                            rows={5}
                            className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Agent'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
