'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Home, Bot, MessageSquare, Settings, Zap, X, Menu, Plus, Trash2, Clock } from 'lucide-react';

interface SavedChat {
    id: string;
    title: string;
    createdAt: string;
    messageCount?: number;
    lastMessage?: string;
}

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);
    const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
    const [loadingChats, setLoadingChats] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const navigation = [
        { name: 'New Chat', href: '/', icon: Plus },
        { name: 'Agents', href: '/agents', icon: Bot },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    useEffect(() => {
        fetchSavedChats();
    }, []);

    const fetchSavedChats = async () => {
        setLoadingChats(true);
        try {
            const res = await fetch('/api/conversations');
            const data = await res.json();
            if (data.success) {
                setSavedChats(data.conversations || []);
            }
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            setLoadingChats(false);
        }
    };

    const confirmDelete = (chatId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setChatToDelete(chatId);
    };

    const deleteChat = async () => {
        if (!chatToDelete) return;
        
        try {
            const res = await fetch(`/api/conversations/${chatToDelete}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setSavedChats(savedChats.filter(c => c.id !== chatToDelete));
                setChatToDelete(null);
            }
        } catch (error) {
            console.error('Failed to delete chat:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0`}
            >
                <div className="flex flex-col h-full bg-card border-r border-border">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                            🤖 Agent0Kit
                        </h1>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="md:hidden p-1 hover:bg-muted rounded transition-colors"
                        >
                            <X size={18} className="text-muted-foreground" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="px-3 py-4 space-y-1 border-b border-border">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => {
                                        if (item.href === '/') {
                                            // Reload page for new chat
                                            window.location.href = '/';
                                        }
                                    }}
                                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-foreground hover:bg-muted'
                                    }`}
                                >
                                    <item.icon
                                        className="mr-3 flex-shrink-0 h-4 w-4"
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Saved Chats */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-3 py-3">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Recent Chats
                                </h2>
                                <button
                                    onClick={fetchSavedChats}
                                    className="text-xs text-primary hover:text-primary/80"
                                    disabled={loadingChats}
                                >
                                    {loadingChats ? '...' : 'Refresh'}
                                </button>
                            </div>
                            
                            {loadingChats ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                                </div>
                            ) : savedChats.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">No saved chats yet</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {savedChats.map((chat) => (
                                        <Link
                                            key={chat.id}
                                            href={`/chat/${chat.id}`}
                                            className="group flex items-start justify-between px-3 py-2 rounded-lg hover:bg-muted transition-all text-sm"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MessageSquare size={14} className="text-muted-foreground flex-shrink-0" />
                                                    <p className="text-foreground font-medium truncate">
                                                        {chat.title || 'Untitled Chat'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock size={12} />
                                                    <span>{isClient ? formatDate(chat.createdAt) : 'Loading...'}</span>
                                                    {chat.messageCount && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{chat.messageCount} msgs</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => confirmDelete(chat.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {chatToDelete && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setChatToDelete(null)}>
                            <div className="bg-card border border-border rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-semibold text-foreground mb-2">Delete Conversation?</h3>
                                <p className="text-muted-foreground mb-6">
                                    This action cannot be undone. This will permanently delete the conversation and all its messages.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setChatToDelete(null)}
                                        className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={deleteChat}
                                        className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Profile */}
                    <div className="flex-shrink-0 border-t border-border p-4">
                        <div className="flex items-center">
                            <div className="inline-block h-10 w-10 rounded-full bg-gradient-to-r from-primary to-purple-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-foreground">
                                    Yash Singh
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    2026 Passout
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}

