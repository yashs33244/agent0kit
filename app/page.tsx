"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from "ai";
import { useState } from "react";
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
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
    }),
  });

  const [input, setInput] = useState('');

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
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="text-gray-600 dark:text-gray-400">Thinking...</span>
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