"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useCallback } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Tool, ToolHeader, ToolContent, ToolOutput } from "@/components/ai-elements/tool";

export default function Home() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
    }),
  });

  // Create conversation on mount
  useEffect(() => {
    const createConversation = async () => {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Chat ${new Date().toLocaleString()}` }),
        });
        const data = await res.json();
        if (data.conversation?.id) {
          setConversationId(data.conversation.id);
          console.log('✅ Conversation created:', data.conversation.id);
        }
      } catch (error) {
        console.error('❌ Failed to create conversation:', error);
      }
    };
    createConversation();
  }, []);

  // Save messages ONLY when streaming is complete (status is 'ready')
  useEffect(() => {
    // Wait for conversation to be created AND streaming to finish
    if (!conversationId || messages.length === 0 || status !== 'ready') {
      if (!conversationId && messages.length > 0) {
        console.log('⏳ Waiting for conversation to be created before saving...');
      }
      return;
    }

    const saveNewMessages = async () => {
      // Only process messages that haven't been saved yet
      const newMessages = messages.filter(msg => !savedMessageIds.has(msg.id));
      
      if (newMessages.length === 0) return;
      
      console.log(`💾 Stream complete! Saving ${newMessages.length} messages...`);

      for (const message of newMessages) {
        // Extract text content
        const textParts = message.parts.filter(p => p.type === 'text');
        const content = textParts.map(p => (p as any).text).join('\n');
        
        // Skip empty messages (intermediate states)
        if (!content || content.trim() === '') {
          console.log(`⏭️ Skipping empty message: ${message.id}`);
          continue;
        }
        
        // Extract tool calls and results
        const toolParts = message.parts.filter(p => p.type.startsWith('tool-'));
        const toolCalls = toolParts.length > 0 ? JSON.stringify(toolParts) : null;
        
        try {
          const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId,
              role: message.role,
              content: content,
              toolCalls,
              toolResults: null,
            }),
          });

          if (res.ok) {
            setSavedMessageIds(prev => {
              const newSet = new Set(prev);
              newSet.add(message.id);
              return newSet;
            });
            console.log(`✅ Complete message saved: ${message.id.substring(0, 8)}... (${content.length} chars)`);
          } else {
            const error = await res.json();
            console.error('❌ Failed to save message:', error);
          }
        } catch (error) {
          console.error('❌ Error saving message:', error);
        }
      }
    };

    saveNewMessages();
  }, [status, messages, conversationId]);

  const handleSubmit = (message: { text?: string; files?: any[] }, e: React.FormEvent) => {
    e.preventDefault();
    if (message.text?.trim() && status === 'ready') {
      sendMessage({ text: message.text });
      setInput('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-between py-8 px-4 bg-white dark:bg-black">
        {/* Header */}
        <div className="w-full text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI Agent Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test your AI agent with web search and GitHub tools
          </p>
        </div>

        {/* Chat Messages using AI Elements */}
        <Conversation className="flex-1 w-full max-w-3xl mb-6">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                title="Welcome! Try asking me something like:"
                description=""
                icon={
                  <div className="text-4xl mb-4">🤖</div>
                }
              >
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>• "What's the latest news about AI?"</p>
                  <p>• "Show me recent pull requests from the vercel/ai repository"</p>
                  <p>• "Search for information about Next.js 16"</p>
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, index) => {
                      if (part.type === 'text') {
                        return <Response key={index}>{part.text}</Response>;
                      }
                      
                      if (part.type.startsWith('tool-')) {
                        const toolName = part.type.replace('tool-', '');
                        // Handle tool invocation parts safely
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
              ))
            )}
            
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
          </ConversationContent>
        </Conversation>

        {/* Input Form using AI Elements */}
        <div className="w-full max-w-3xl">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={status !== 'ready'}
            />
            <PromptInputSubmit disabled={status !== 'ready' || !input.trim()} />
          </PromptInput>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by AI SDK 6 Beta with Anthropic Claude</p>
        </div>
      </main>
    </div>
  );
}