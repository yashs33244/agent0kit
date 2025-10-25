'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Settings, Bell, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface AgentConfig {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    status: 'active' | 'paused' | 'running' | 'error';
    schedule: string;
    lastRun?: Date;
    nextRun?: Date;
    successRate: number;
    totalRuns: number;
}

interface AgentRun {
    id: string;
    agentId: string;
    status: 'success' | 'error' | 'running';
    timestamp: Date;
    duration?: number;
    result?: any;
    error?: string;
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<AgentConfig[]>([
        {
            id: 'linkedin-job-hunter',
            name: 'LinkedIn Job Hunter',
            description: 'Automatically searches LinkedIn for HR posts and job opportunities for 2026 passouts',
            icon: '💼',
            category: 'Job Search',
            status: 'active',
            schedule: '0 9,17 * * *', // 9 AM and 5 PM daily
            lastRun: new Date(Date.now() - 3600000),
            nextRun: new Date(Date.now() + 28800000),
            successRate: 92,
            totalRuns: 45
        },
        {
            id: 'twitter-tech-poster',
            name: 'Twitter Tech Poster',
            description: 'Posts tweets about latest tech trends, coding tips, and DevOps insights',
            icon: '🐦',
            category: 'Social Media',
            status: 'active',
            schedule: '0 8,14,20 * * *', // 8 AM, 2 PM, 8 PM daily
            lastRun: new Date(Date.now() - 7200000),
            nextRun: new Date(Date.now() + 21600000),
            successRate: 98,
            totalRuns: 127
        },
        {
            id: 'github-trending',
            name: 'GitHub Trending Tracker',
            description: 'Monitors trending repositories and notifies about relevant projects',
            icon: '⭐',
            category: 'Development',
            status: 'paused',
            schedule: '0 10 * * *', // 10 AM daily
            lastRun: new Date(Date.now() - 86400000),
            successRate: 100,
            totalRuns: 23
        },
        {
            id: 'web-research',
            name: 'Tech News Aggregator',
            description: 'Searches for latest tech news and compiles a daily digest',
            icon: '📰',
            category: 'Research',
            status: 'active',
            schedule: '0 7 * * *', // 7 AM daily
            lastRun: new Date(Date.now() - 14400000),
            nextRun: new Date(Date.now() + 25200000),
            successRate: 95,
            totalRuns: 31
        }
    ]);

    const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
    const [runs, setRuns] = useState<AgentRun[]>([]);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleToggleAgent = (agentId: string) => {
        setAgents(agents.map(agent => 
            agent.id === agentId 
                ? { ...agent, status: agent.status === 'active' ? 'paused' : 'active' }
                : agent
        ));
    };

    const handleRunNow = async (agentId: string) => {
        // Set agent to running state
        setAgents(agents.map(agent => 
            agent.id === agentId 
                ? { ...agent, status: 'running' }
                : agent
        ));

        try {
            console.log(`🚀 Running agent: ${agentId}`);
            
            // Call the API to run the agent
            const response = await fetch('/api/agents/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ agentId }),
            });

            const result = await response.json();
            
            console.log(`✅ Agent ${agentId} completed:`, result);

            // Update agent with success status
            setAgents(agents.map(agent => 
                agent.id === agentId 
                    ? { 
                        ...agent, 
                        status: result.success ? 'active' : 'error', 
                        lastRun: new Date(),
                        totalRuns: agent.totalRuns + 1,
                        successRate: result.success 
                            ? Math.round((agent.successRate * agent.totalRuns + 100) / (agent.totalRuns + 1))
                            : Math.round((agent.successRate * agent.totalRuns) / (agent.totalRuns + 1))
                    }
                    : agent
            ));

            // Show a toast notification (you can add a toast library)
            alert(result.success 
                ? `✅ Agent ran successfully!\n\n${result.response?.substring(0, 200)}...` 
                : `❌ Agent failed: ${result.error}`
            );

        } catch (error) {
            console.error(`❌ Failed to run agent ${agentId}:`, error);
            
            // Update agent with error status
            setAgents(agents.map(agent => 
                agent.id === agentId 
                    ? { ...agent, status: 'error' }
                    : agent
            ));

            alert(`❌ Failed to run agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const formatNextRun = (date?: Date) => {
        if (!date) return 'Not scheduled';
        const diff = date.getTime() - Date.now();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        if (hours > 24) {
            return `in ${Math.floor(hours / 24)} days`;
        } else if (hours > 0) {
            return `in ${hours}h ${minutes}m`;
        } else {
            return `in ${minutes}m`;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                🤖 AI Agents Dashboard
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Automated agents running 24/7 to help you find jobs and opportunities
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                                    notificationsEnabled
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <Bell className="w-4 h-4 mr-2" />
                                Notifications {notificationsEnabled ? 'On' : 'Off'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Active Agents</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {agents.filter(a => a.status === 'active').length}
                                </p>
                            </div>
                            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Runs Today</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {agents.reduce((sum, a) => sum + Math.floor(a.totalRuns / 7), 0)}
                                </p>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {Math.round(agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length)}%
                                </p>
                            </div>
                            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Next Run</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatNextRun(agents.find(a => a.nextRun)?.nextRun)}
                                </p>
                            </div>
                            <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agents List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start space-x-3">
                                    <span className="text-3xl">{agent.icon}</span>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {agent.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {agent.description}
                                        </p>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mt-2">
                                            {agent.category}
                                        </span>
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        agent.status === 'active'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : agent.status === 'running'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                            : agent.status === 'paused'
                                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    }`}
                                >
                                    {agent.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Schedule:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {agent.schedule.includes('9,17') ? 'Twice daily (9 AM, 5 PM)' :
                                         agent.schedule.includes('8,14,20') ? '3x daily (8 AM, 2 PM, 8 PM)' :
                                         'Daily at 10 AM'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Last Run:</span>
                                    <span className="text-gray-900 dark:text-white">
                                        {agent.lastRun ? new Date(agent.lastRun).toLocaleString() : 'Never'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {formatNextRun(agent.nextRun)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
                                    <span className="text-green-600 dark:text-green-400 font-semibold">
                                        {agent.successRate}% ({agent.totalRuns} runs)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleToggleAgent(agent.id)}
                                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                                        agent.status === 'active'
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
                                    }`}
                                    disabled={agent.status === 'running'}
                                >
                                    {agent.status === 'active' ? (
                                        <>
                                            <Pause className="w-4 h-4 mr-2" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Activate
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleRunNow(agent.id)}
                                    disabled={agent.status === 'running' || agent.status === 'paused'}
                                    className="flex-1 flex items-center justify-center px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    {agent.status === 'running' ? 'Running...' : 'Run Now'}
                                </button>
                                <button
                                    onClick={() => setSelectedAgent(agent)}
                                    className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Notification Setup Instructions */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        📬 Notification Integration
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Get notified about agent runs, job opportunities, and important updates through your preferred channels.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">💬 Slack Integration</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Set up Slack webhooks to receive real-time notifications about agent runs and opportunities.
                            </p>
                            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                Configure Slack →
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">📱 WhatsApp Integration</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Connect WhatsApp Business API to get instant updates on your mobile device.
                            </p>
                            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                Configure WhatsApp →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

