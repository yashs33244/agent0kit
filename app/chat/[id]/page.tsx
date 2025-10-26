'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Tool, ToolHeader, ToolContent, ToolOutput } from "@/components/ai-elements/tool";
import { ArrowLeft, Loader2 } from 'lucide-react';

interface ChatMessage {
    id: string;
    role: string;
    content: string;
    toolCalls?: any;
    toolResults?: any;
    createdAt: string;
}

interface ConversationData {
    id: string;
    title: string;
    createdAt: string;
    messages: ChatMessage[];
}

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [conversation, setConversation] = useState<ConversationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);
    const [input, setInput] = useState('');
    const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());

    const { messages, sendMessage, status, error, stop } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/agent',
        }),
    });

    useEffect(() => {
        params.then(setUnwrappedParams);
    }, [params]);

    useEffect(() => {
        if (unwrappedParams) {
            fetchConversation();
        }
    }, [unwrappedParams]);

    const fetchConversation = async () => {
        if (!unwrappedParams) return;
        
        try {
            const res = await fetch(`/api/conversations/${unwrappedParams.id}`);
            const data = await res.json();
            
            if (data.success) {
                // Fetch all messages (with pagination support on server)
                const messagesRes = await fetch(`/api/messages?conversationId=${unwrappedParams.id}&limit=1000`);
                const messagesData = await messagesRes.json();
                
                setConversation({
                    id: data.conversation.id,
                    title: data.conversation.title,
                    createdAt: data.conversation.createdAt,
                    messages: messagesData.messages || [],
                });
                
                // Mark ALL existing messages as saved by their database IDs
                const existingIds = new Set(messagesData.messages.map((m: ChatMessage) => m.id));
                setSavedMessageIds(existingIds as Set<string>);
                
                console.log(`✅ Loaded ${messagesData.messages.length} existing messages`);
            }
        } catch (error) {
            console.error('Failed to fetch conversation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Save new messages ONLY when streaming is complete (status is 'ready')
    useEffect(() => {
        // Only save when status is 'ready' (streaming finished)
        if (!unwrappedParams || messages.length === 0 || status !== 'ready') return;

        const saveNewMessages = async () => {
            // Only process messages that are genuinely new (not already in DB)
            const newMessages = messages.filter(msg => !savedMessageIds.has(msg.id));
            
            if (newMessages.length === 0) return;
            
            console.log(`💾 Stream complete! Saving ${newMessages.length} complete messages...`);

            for (const message of newMessages) {
                // Extract text content
                const textParts = message.parts.filter(p => p.type === 'text');
                const content = textParts.map(p => (p as any).text).join('\n');
                
                // Skip if no content (intermediate states)
                if (!content || content.trim() === '') {
                    console.log(`⏭️ Skipping empty message: ${message.id}`);
                    continue;
                }
                
                const toolParts = message.parts.filter(p => p.type.startsWith('tool-'));
                const toolCalls = toolParts.length > 0 ? JSON.stringify(toolParts) : null;
                
                try {
                    const res = await fetch('/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            conversationId: unwrappedParams.id,
                            role: message.role,
                            content: content,
                            toolCalls,
                            toolResults: null,
                        }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        // Mark as saved using the generated message ID
                        setSavedMessageIds(prev => {
                            const newSet = new Set(prev);
                            newSet.add(message.id);
                            return newSet;
                        });
                        console.log(`✅ Complete message saved: ${message.id.substring(0, 8)}... (${content.length} chars)`);
                    } else {
                        console.error(`❌ Failed to save message: ${await res.text()}`);
                    }
                } catch (error) {
                    console.error('❌ Error saving message:', error);
                }
            }
        };

        saveNewMessages();
    }, [status, messages, unwrappedParams]);

    const handleSubmit = (message: { text?: string; files?: any[] }, e: React.FormEvent) => {
        e.preventDefault();
        if (message.text?.trim() && status === 'ready') {
            sendMessage({ text: message.text });
            setInput('');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading conversation...</p>
                </div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <p className="text-destructive mb-4">Conversation not found</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                    >
                        Back to Chat
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-between py-8 px-4 bg-white dark:bg-black">
                {/* Header */}
                <div className="w-full text-center mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        New Chat
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {conversation.title}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Continue your conversation • {conversation.messages.length + messages.length} messages
                    </p>
                </div>

                {/* Chat Messages using AI Elements */}
                <Conversation className="flex-1 w-full max-w-3xl mb-6">
                    <ConversationContent>
                        {conversation.messages.length === 0 && messages.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation below!</p>
                            </div>
                        ) : (
                            <>
                                {/* Saved messages from database */}
                                {conversation.messages.map((message) => {
                                    // Parse tool calls if they exist
                                    let toolCalls = [];
                                    if (message.toolCalls) {
                                        try {
                                            toolCalls = typeof message.toolCalls === 'string' 
                                                ? JSON.parse(message.toolCalls) 
                                                : message.toolCalls;
                                        } catch (e) {
                                            console.error('Failed to parse tool calls:', e);
                                        }
                                    }

                                    return (
                                        <Message key={message.id} from={message.role as 'system' | 'user' | 'assistant'}>
                                            <MessageContent>
                                                {/* Text content */}
                                                {message.content && (
                                                    <Response>{message.content}</Response>
                                                )}
                                                
                                                {/* Tool calls */}
                                                {Array.isArray(toolCalls) && toolCalls.length > 0 && toolCalls.map((tool: any, index: number) => {
                                                    const toolName = tool.type?.replace('tool-', '') || 'Unknown Tool';
                                                    return (
                                                        <Tool key={index} defaultOpen={false}>
                                                            <ToolHeader
                                                                title={toolName}
                                                                type={tool.type || 'tool-call'}
                                                                state="output-available"
                                                            />
                                                            <ToolContent>
                                                                <ToolOutput
                                                                    output={tool.output || tool.input || tool.args || tool}
                                                                    errorText={tool.errorText}
                                                                />
                                                            </ToolContent>
                                                        </Tool>
                                                    );
                                                })}
                                            </MessageContent>
                                        </Message>
                                    );
                                })}

                                {/* New messages from current session */}
                                {messages.map((message) => (
                                    <Message key={message.id} from={message.role}>
                                        <MessageContent>
                                            {message.parts.map((part, index) => {
                                                if (part.type === 'text') {
                                                    return <Response key={index}>{part.text}</Response>;
                                                }
                                                
                                                if (part.type.startsWith('tool-')) {
                                                    const toolName = part.type.replace('tool-', '');
                                                    const toolData = part as any;
                                                    return (
                                                        <Tool key={index} defaultOpen={false}>
                                                            <ToolHeader
                                                                title={toolName}
                                                                type={part.type as any}
                                                                state="output-available"
                                                            />
                                                            <ToolContent>
                                                                <ToolOutput
                                                                    output={toolData.output || toolData.input || toolData.args}
                                                                    errorText={toolData.errorText}
                                                                />
                                                            </ToolContent>
                                                        </Tool>
                                                    );
                                                }
                                                
                                                return null;
                                            })}
                                        </MessageContent>
                                    </Message>
                                ))}

                                {/* Thinking indicator */}
                                {status === 'submitted' && (
                                    <Message from="assistant">
                                        <MessageContent>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                    <span className="text-gray-600 dark:text-gray-400">Thinking...</span>
                                                </div>
                                                <button
                                                    onClick={() => stop()}
                                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                                                >
                                                    Stop
                                                </button>
                                            </div>
                                        </MessageContent>
                                    </Message>
                                )}

                                {/* Error display */}
                                {error && (
                                    <Message from="assistant">
                                        <MessageContent>
                                            <div className="text-red-600 dark:text-red-400 mb-2">
                                                An error occurred. Please try again.
                                            </div>
                                            <button 
                                                onClick={() => window.location.reload()}
                                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Retry
                                            </button>
                                        </MessageContent>
                                    </Message>
                                )}
                            </>
                        )}
                    </ConversationContent>
                </Conversation>

                {/* Input Form */}
                <div className="w-full sticky bottom-0 bg-background pb-4">
                    <PromptInput onSubmit={handleSubmit}>
                        <PromptInputTextarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Continue the conversation..."
                            disabled={status !== 'ready'}
                        />
                        <PromptInputSubmit className='m-4' disabled={status !== 'ready' || !input.trim()} />
                    </PromptInput>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        💾 Your messages are automatically saved to this conversation
                    </p>
                </div>
            </main>
        </div>
    );
}

