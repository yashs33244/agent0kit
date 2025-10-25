/**
 * Vector Database Service using Qdrant
 * For storing and retrieving chat embeddings for long-term memory
 */

import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = 'chat_messages';
const VECTOR_SIZE = 1536; // OpenAI text-embedding-3-small dimension

// Initialize Qdrant client
let qdrantClient: QdrantClient | null = null;

function getQdrantClient(): QdrantClient {
    if (!qdrantClient) {
        const url = process.env.QDRANT_URL || 'http://localhost:6333';
        const apiKey = process.env.QDRANT_API_KEY;

        qdrantClient = new QdrantClient({
            url,
            apiKey,
        });
    }

    return qdrantClient;
}

// Initialize collection if it doesn't exist
export async function initializeVectorDB(): Promise<boolean> {
    try {
        const client = getQdrantClient();

        // Check if collection exists
        const collections = await client.getCollections();
        const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

        if (!exists) {
            console.log('📊 Creating Qdrant collection for chat memory...');

            await client.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: 'Cosine',
                },
                optimizers_config: {
                    default_segment_number: 2,
                },
                replication_factor: 1,
            });

            console.log('✅ Qdrant collection created successfully');
        }

        return true;
    } catch (error) {
        console.error('❌ Failed to initialize vector DB:', error);
        return false;
    }
}

// Generate embedding using OpenAI API (via Anthropic if available)
export async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        // Use OpenAI embeddings API (you can also use other providers)
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: text,
            }),
        });

        if (!response.ok) {
            console.error('❌ Embedding API error:', await response.text());
            return null;
        }

        const data = await response.json();
        return data.data[0].embedding;
    } catch (error) {
        console.error('❌ Failed to generate embedding:', error);
        return null;
    }
}

// Store message with embedding
export async function storeMessageEmbedding(
    messageId: string,
    conversationId: string,
    text: string,
    role: string,
    metadata?: Record<string, any>
): Promise<boolean> {
    try {
        const embedding = await generateEmbedding(text);

        if (!embedding) {
            console.log('⚠️ Skipping vector storage - no embedding generated');
            return false;
        }

        const client = getQdrantClient();

        // Ensure collection exists before upserting
        try {
            await client.getCollection(COLLECTION_NAME);
        } catch (collectionError) {
            // Collection doesn't exist, create it
            console.log('📊 Creating Qdrant collection...');
            await initializeVectorDB();
        }

        // Convert messageId to a numeric ID for Qdrant (hash the string)
        const numericId = messageId.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0) >>> 0; // Convert to unsigned 32-bit integer

        await client.upsert(COLLECTION_NAME, {
            wait: true,
            points: [
                {
                    id: numericId,
                    vector: embedding,
                    payload: {
                        messageId,
                        conversationId,
                        text: text.substring(0, 500), // Store truncated text
                        role,
                        timestamp: new Date().toISOString(),
                        ...metadata,
                    },
                },
            ],
        });

        console.log('✅ Embedding stored successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to store embedding:', error);
        return false;
    }
}

// Search for similar messages
export async function searchSimilarMessages(
    query: string,
    conversationId?: string,
    limit: number = 5
): Promise<Array<{
    messageId: string;
    text: string;
    role: string;
    score: number;
    timestamp: string;
}>> {
    try {
        const embedding = await generateEmbedding(query);

        if (!embedding) {
            return [];
        }

        const client = getQdrantClient();

        const searchResult = await client.search(COLLECTION_NAME, {
            vector: embedding,
            limit,
            filter: conversationId
                ? {
                    must: [
                        {
                            key: 'conversationId',
                            match: { value: conversationId },
                        },
                    ],
                }
                : undefined,
            with_payload: true,
        });

        return searchResult.map(result => ({
            messageId: result.payload?.messageId as string,
            text: result.payload?.text as string,
            role: result.payload?.role as string,
            score: result.score,
            timestamp: result.payload?.timestamp as string,
        }));
    } catch (error) {
        console.error('❌ Failed to search similar messages:', error);
        return [];
    }
}

// Get conversation context for current message
export async function getConversationContext(
    currentMessage: string,
    conversationId: string,
    limit: number = 5
): Promise<string> {
    const similarMessages = await searchSimilarMessages(currentMessage, conversationId, limit);

    if (similarMessages.length === 0) {
        return '';
    }

    let context = '### Relevant Previous Context:\n\n';

    similarMessages.forEach((msg, idx) => {
        context += `${idx + 1}. [${msg.role}]: ${msg.text}\n`;
    });

    return context;
}

// Delete conversation embeddings (for cleanup)
export async function deleteConversationEmbeddings(conversationId: string): Promise<boolean> {
    try {
        const client = getQdrantClient();

        await client.delete(COLLECTION_NAME, {
            wait: true,
            filter: {
                must: [
                    {
                        key: 'conversationId',
                        match: { value: conversationId },
                    },
                ],
            },
        });

        console.log(`✅ Deleted embeddings for conversation ${conversationId}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to delete embeddings:', error);
        return false;
    }
}

// Get collection stats
export async function getVectorDBStats(): Promise<{
    totalMessages: number;
    collections: number;
} | null> {
    try {
        const client = getQdrantClient();

        const collectionInfo = await client.getCollection(COLLECTION_NAME);
        const collections = await client.getCollections();

        return {
            totalMessages: collectionInfo.points_count || 0,
            collections: collections.collections.length,
        };
    } catch (error) {
        console.error('❌ Failed to get vector DB stats:', error);
        return null;
    }
}

// Health check
export async function checkVectorDBHealth(): Promise<boolean> {
    try {
        const client = getQdrantClient();
        await client.getCollections();
        return true;
    } catch (error) {
        console.error('❌ Vector DB health check failed:', error);
        return false;
    }
}

