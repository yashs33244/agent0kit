import { anthropic } from "@ai-sdk/anthropic"
import { ANTHROPIC_MODEL } from "../config";
import { tavily } from "@tavily/core";
import { openai } from "@ai-sdk/openai";
import { OPENAI_MODEL } from "../config";
// Create the model instance using the new AI SDK 6 Beta pattern
export const anthropicClient = anthropic(ANTHROPIC_MODEL);

// AI Configuration
export const aiConfig = {
    maxSteps: 20, // Default from AI SDK 6 Beta - allows up to 20 tool call loops
    temperature: 0.7, // Controls randomness (0-1, higher = more creative)
} as const;

// Initialize Tavily search client
export const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export const openaiClient = openai(OPENAI_MODEL);