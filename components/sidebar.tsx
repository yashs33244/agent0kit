'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Bot, MessageSquare, Settings, Zap } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();

    const navigation = [
        { name: 'Chat', href: '/', icon: MessageSquare },
        { name: 'Agents', href: '/agents', icon: Bot },
        { name: 'Quick Actions', href: '/quick-actions', icon: Zap },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
            <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-5">
                <div className="flex items-center flex-shrink-0 px-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        🤖 Agent0Kit
                    </h1>
                </div>
                <div className="mt-5 flex-grow flex flex-col">
                    <nav className="flex-1 px-2 pb-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <item.icon
                                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                                            isActive
                                                ? 'text-blue-700 dark:text-blue-200'
                                                : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400'
                                        }`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex-shrink-0 w-full group block">
                        <div className="flex items-center">
                            <div>
                                <div className="inline-block h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Yash Singh
                                </p>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    2026 Passout
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

