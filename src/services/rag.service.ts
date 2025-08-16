import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs';
import * as path from 'path';
import { ChromaClient, Collection } from 'chromadb';

export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    chunkIndex: number;
    timestamp: string;
  };
}

export interface SearchResult {
  content: string;
  metadata: DocumentChunk['metadata'];
  similarity: number;
}

@Injectable()
export class RagService implements OnModuleInit {
  private readonly documentsPath = path.join(process.cwd(), 'data', 'file.txt');
  private readonly chunkSize = 1000; // characters per chunk
  private readonly chunkOverlap = 50; // overlap between chunks
  private documentChunks: DocumentChunk[] = [];
  private isInitialized = false;
  private mistralClient: Mistral;
  private chromaClient: ChromaClient;
  private collection: Collection;
  private readonly collectionName = 'document_embeddings';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('MISTRAL_API_KEY');
    if (!apiKey || apiKey === 'your_mistral_api_key_here') {
      return;
    }
    
    this.mistralClient = new Mistral({ apiKey });
    
    // Initialize ChromaDB client
    const chromaHost = this.configService.get<string>('CHROMA_HOST') || 'localhost';
    const chromaPort = this.configService.get<string>('CHROMA_PORT') || '8000';
    
    this.chromaClient = new ChromaClient({
      path: `http://${chromaHost}:${chromaPort}`
    });
  }

  async onModuleInit() {
    await this.initializeRag();
  }

  private async initializeRag(): Promise<void> {
    try {
      // Check if data file exists
      if (!fs.existsSync(this.documentsPath)) {
        return;
      }

      // Check if Mistral client is available
      if (!this.mistralClient) {
        return;
      }

      // Initialize ChromaDB collection
      await this.initializeChromaCollection();

      // Try to load cached embeddings from ChromaDB first
      if (await this.loadCachedEmbeddings()) {
        this.isInitialized = true;
        return;
      }

      // If no cache or cache is invalid, load and process documents
      await this.loadAndProcessDocuments();
      this.isInitialized = true;
    } catch (error) {
      // Silent fail for development
    }
  }

  private async initializeChromaCollection(): Promise<void> {
    try {
      // Check if collection exists, if not create it
      const collections = await this.chromaClient.listCollections();
      const collectionExists = collections.some(col => col.name === this.collectionName);
      
      if (!collectionExists) {
        this.collection = await this.chromaClient.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'Document embeddings for RAG system',
            source: 'file.txt'
          }
        });
      } else {
        this.collection = await this.chromaClient.getCollection({
          name: this.collectionName
        });
      }
    } catch (error) {
      throw error;
    }
  }

  private async loadCachedEmbeddings(): Promise<boolean> {
    try {
      // Check if collection has documents
      const count = await this.collection.count();
      if (count === 0) {
        return false;
      }

      // Get all documents from the collection
      const results = await this.collection.get({
        include: ['embeddings', 'metadatas', 'documents']
      });

      if (!results.embeddings || results.embeddings.length === 0) {
        return false;
      }

      // Convert ChromaDB results to DocumentChunk format
      this.documentChunks = results.embeddings.map((embedding, index) => ({
        id: results.ids[index] as string,
        content: results.documents[index] as string,
        embedding: embedding as number[],
        metadata: {
          source: String(results.metadatas?.[index]?.source || 'file.txt'),
          chunkIndex: Number(results.metadatas?.[index]?.chunkIndex || index),
          timestamp: String(results.metadatas?.[index]?.timestamp || new Date().toISOString())
        }
      }));

      return true;

    } catch (error) {
      return false;
    }
  }

  private async saveEmbeddingsToChromaDB(): Promise<void> {
    try {
      if (this.documentChunks.length === 0) {
        return;
      }

      // Prepare data for ChromaDB
      const ids = this.documentChunks.map(chunk => chunk.id);
      const embeddings = this.documentChunks.map(chunk => chunk.embedding);
      const documents = this.documentChunks.map(chunk => chunk.content);
      const metadatas = this.documentChunks.map(chunk => chunk.metadata);

      // Add documents to ChromaDB collection
      await this.collection.add({
        ids,
        embeddings,
        documents,
        metadatas
      });

    } catch (error) {
      // Silent fail for development
    }
  }

  private async loadAndProcessDocuments(): Promise<void> {
    try {
      // Read the document file
      const content = fs.readFileSync(this.documentsPath, 'utf-8');
      
      // Split content into chunks
      const chunks = await this.chunkDocument(content);
      
      // Generate embeddings for each chunk
      this.documentChunks = await this.generateEmbeddings(chunks);
      
      // Save embeddings to ChromaDB
      await this.saveEmbeddingsToChromaDB();
      
    } catch (error) {
      // Silent fail for development
    }
  }

  private async chunkDocument(content: string): Promise<string[]> {
    // Create LangChain text splitter with optimized settings
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      separators: [
        '\n\n',      // Paragraph breaks
        '\n',        // Line breaks
        '. ',        // Sentence endings
        '! ',        // Exclamation endings
        '? ',        // Question endings
        '; ',        // Semicolon separators
        ', ',        // Comma separators
        ' ',         // Word boundaries
        ''           // Character level (fallback)
      ],
      keepSeparator: false,
      lengthFunction: (text) => text.length,
    });

    // Split the document into chunks
    const chunks = await textSplitter.splitText(content);
    
    // Filter out very short chunks
    const filteredChunks = chunks.filter(chunk => chunk.trim().length > 50);

    return filteredChunks;
  }

  private async generateEmbeddings(chunks: string[]): Promise<DocumentChunk[]> {
    const documentChunks: DocumentChunk[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        
        // Generate embedding using Mistral
        const embeddingResponse = await this.mistralClient.embeddings.create({
          model: 'mistral-embed',
          inputs: chunk
        });

        const embedding = embeddingResponse.data[0].embedding;
        
        if (!embedding) {
          continue;
        }

        documentChunks.push({
          id: `chunk_${i}`,
          content: chunk,
          embedding,
          metadata: {
            source: 'file.txt',
            chunkIndex: i,
            timestamp: new Date().toISOString()
          }
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        // Silent fail for development
      }
    }

    return documentChunks;
  }

  async searchSimilarChunks(query: string, limit: number = 3): Promise<SearchResult[]> {
    if (!this.isInitialized || this.documentChunks.length === 0) {
      return [];
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.mistralClient.embeddings.create({
        model: 'mistral-embed',
        inputs: query
      });

      const queryVector = queryEmbedding.data[0].embedding;
      
      if (!queryVector) {
        return [];
      }

      // Use ChromaDB for similarity search
      const searchResults = await this.collection.query({
        queryEmbeddings: [queryVector],
        nResults: limit,
        include: ['embeddings', 'metadatas', 'documents', 'distances']
      });

      if (!searchResults.documents || searchResults.documents.length === 0) {
        return [];
      }

      // Convert ChromaDB results to SearchResult format
      const results: SearchResult[] = [];
      for (let i = 0; i < searchResults.documents[0].length; i++) {
        const distance = searchResults.distances?.[0]?.[i] || 0;
        // Convert distance to similarity (ChromaDB uses cosine distance, 0 = identical, 2 = opposite)
        const similarity = 1 - (distance / 2);
        
        if (similarity > 0.3) { // Only return relevant results
          results.push({
            content: searchResults.documents[0][i] as string,
            metadata: {
              source: String(searchResults.metadatas?.[0]?.[i]?.source || 'file.txt'),
              chunkIndex: Number(searchResults.metadatas?.[0]?.[i]?.chunkIndex || i),
              timestamp: String(searchResults.metadatas?.[0]?.[i]?.timestamp || new Date().toISOString())
            },
            similarity
          });
        }
      }

      return results.sort((a, b) => b.similarity - a.similarity);

    } catch (error) {
      return [];
    }
  }

  async getRelevantContext(query: string, maxChunks: number = 3): Promise<string> {
    const similarChunks = await this.searchSimilarChunks(query, maxChunks);
    
    if (similarChunks.length === 0) {
      return '';
    }

    // Combine relevant chunks into context
    const context = similarChunks
      .map((chunk, index) => `[Context ${index + 1}]\n${chunk.content}`)
      .join('\n\n');

    return `Based on the following relevant information:\n\n${context}\n\n`;
  }

  getStatus(): { initialized: boolean; chunkCount: number; dataPath: string; embeddingsEnabled: boolean; chromaDbStatus: string; collectionName: string } {
    return {
      initialized: this.isInitialized,
      chunkCount: this.documentChunks.length,
      dataPath: this.documentsPath,
      embeddingsEnabled: !!this.mistralClient,
      chromaDbStatus: this.collection ? 'Connected' : 'Not connected',
      collectionName: this.collectionName
    };
  }

  async refreshDocuments(): Promise<void> {
    // Clear ChromaDB collection and regenerate embeddings
    if (this.collection) {
      try {
        await this.collection.delete({});
      } catch (error) {
        // Silent fail for development
      }
    }
    await this.initializeRag();
  }

  async clearCache(): Promise<void> {
    if (this.collection) {
      try {
        await this.collection.delete({});
      } catch (error) {
        // Silent fail for development
      }
    }
  }
}
