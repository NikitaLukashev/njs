import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs';
import * as path from 'path';

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

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('MISTRAL_API_KEY');
    if (!apiKey || apiKey === 'your_mistral_api_key_here') {
      console.warn('MISTRAL_API_KEY not configured. RAG embeddings will not work.');
      return;
    }
    
    this.mistralClient = new Mistral({ apiKey });
  }

  async onModuleInit() {
    await this.initializeRag();
  }

  private async initializeRag(): Promise<void> {
    try {
      // Check if data file exists
      if (!fs.existsSync(this.documentsPath)) {
        console.warn(`Data file not found at ${this.documentsPath}. RAG will not be available.`);
        return;
      }

      // Check if Mistral client is available
      if (!this.mistralClient) {
        console.warn('Mistral client not available. RAG will not be available.');
        return;
      }

      // Load and process documents
      await this.loadAndProcessDocuments();
      this.isInitialized = true;
      console.log(`RAG initialized with ${this.documentChunks.length} document chunks`);
    } catch (error) {
      console.error('Failed to initialize RAG:', error);
    }
  }

  private async loadAndProcessDocuments(): Promise<void> {
    try {
      // Read the document file
      const content = fs.readFileSync(this.documentsPath, 'utf-8');
      
      console.log(`Loaded document: ${content.length} characters`);
      console.log(`Document content preview: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
      
      // Split content into chunks
      const chunks = await this.chunkDocument(content);
      
      // Generate embeddings for each chunk
      this.documentChunks = await this.generateEmbeddings(chunks);
      
      console.log(`Processed document into ${this.documentChunks.length} chunks with embeddings`);
      
      // Log chunk details for debugging
      this.documentChunks.forEach((chunk, index) => {
        console.log(`Chunk ${index}: ${chunk.content.length} chars - "${chunk.content.substring(0, 50)}${chunk.content.length > 50 ? '...' : ''}"`);
      });
      
    } catch (error) {
      console.error('Error loading documents:', error);
      throw error;
    }
  }

  private async chunkDocument(content: string): Promise<string[]> {
    console.log(`Starting LangChain document chunking for ${content.length} characters`);
      
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
      
      // Filter out very short chunks and log results
      const filteredChunks = chunks

      console.log(`LangChain created ${chunks.length} chunks, filtered to ${filteredChunks.length} valid chunks`);
      
      // Log chunk details for debugging
      filteredChunks.forEach((chunk, index) => {
        console.log(`Chunk ${index}: ${chunk.length} chars - "${chunk.substring(0, 50)}${chunk.length > 50 ? '...' : ''}"`);
      });

      return filteredChunks;
      
    
  }

  

  private async generateEmbeddings(chunks: string[]): Promise<DocumentChunk[]> {
    const documentChunks: DocumentChunk[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
        
        // Generate embedding using Mistral
        const embeddingResponse = await this.mistralClient.embeddings.create({
          model: 'mistral-embed',
          inputs: chunk
        });

        const embedding = embeddingResponse.data[0].embedding;
        
        if (!embedding) {
          console.warn(`No embedding generated for chunk ${i}`);
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
        console.error(`Error generating embedding for chunk ${i}:`, error);
        // Continue with other chunks even if one fails
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
        console.error('Failed to generate query embedding');
        return [];
      }

      // Calculate similarity with all chunks using dot product
      const results = this.documentChunks
        .map(chunk => ({
          content: chunk.content,
          metadata: chunk.metadata,
          similarity: this.calculateSimilarity(queryVector, chunk.embedding)
        }))
        .filter(result => result.similarity > 0.3) // Only return relevant results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Error searching similar chunks:', error);
      return [];
    }
  }

  private calculateSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      return 0;
    }

    // Simple dot product similarity (more efficient than cosine)
    let similarity = 0;
    for (let i = 0; i < vectorA.length; i++) {
      similarity += vectorA[i] * vectorB[i];
    }
    
    return similarity;
  }

  async getRelevantContext(query: string, maxChunks: number = 3): Promise<string> {
    const similarChunks = await this.searchSimilarChunks(query, maxChunks);
    console.log(similarChunks)
    
    if (similarChunks.length === 0) {
      return '';
    }

    // Combine relevant chunks into context
    const context = similarChunks
      .map((chunk, index) => `[Context ${index + 1}]\n${chunk.content}`)
      .join('\n\n');

    return `Based on the following relevant information:\n\n${context}\n\n`;
  }

  getStatus(): { initialized: boolean; chunkCount: number; dataPath: string; embeddingsEnabled: boolean } {
    return {
      initialized: this.isInitialized,
      chunkCount: this.documentChunks.length,
      dataPath: this.documentsPath,
      embeddingsEnabled: !!this.mistralClient
    };
  }

  async refreshDocuments(): Promise<void> {
    await this.initializeRag();
  }
}
