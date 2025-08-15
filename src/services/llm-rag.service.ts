import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';
import { RagService } from './rag.service';

export interface QuestionRequest {
  question: string;
  maxContextChunks?: number;
  temperature?: number;
}

export interface QuestionResponse {
  answer: string;
  context: string;
  sources: string[];
  timestamp: string;
}

@Injectable()
export class LlmRagService {
  private mistralClient: Mistral;

  constructor(
    private configService: ConfigService,
    private ragService: RagService
  ) {
    const apiKey = this.configService.get<string>('MISTRAL_API_KEY');
    if (!apiKey || apiKey === 'your_mistral_api_key_here') {
      throw new Error('MISTRAL_API_KEY not configured. LLM RAG service cannot function.');
    }
    
    this.mistralClient = new Mistral({ apiKey });
  }

  async askQuestion(request: QuestionRequest): Promise<QuestionResponse> {
    try {
      const { question, maxContextChunks = 3, temperature = 0.7 } = request;

      // Get relevant context from RAG service
      const context = await this.ragService.getRelevantContext(question, maxContextChunks);
      
      // Get status to check if RAG is available
      const ragStatus = this.ragService.getStatus();
      
      if (!ragStatus.initialized || ragStatus.chunkCount === 0) {
        return {
          answer: 'Sorry, I cannot answer questions at the moment. The RAG system is not properly initialized.',
          context: '',
          sources: [],
          timestamp: new Date().toISOString()
        };
      }

      // Prepare the prompt with context
      const prompt = this.buildPrompt(question, context);
      
      // Generate response using Mistral
      const response = await this.mistralClient.chat.complete({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant. Answer questions based on the provided context. If the context doesn't contain enough information to answer the question, say so. Be concise but informative.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        maxTokens: 4000,
      });

      const answer = response.choices?.[0]?.message?.content || 'No response generated';

      // Ensure answer is a string
      const answerString = typeof answer === 'string' ? answer : 'No response generated';

      // Extract sources from context
      const sources = this.extractSources(context);

      return {
        answer: answerString,
        context: context || 'No relevant context found',
        sources,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in LLM RAG service:', error);
      return {
        answer: `Error processing your question: ${error.message}`,
        context: '',
        sources: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  private buildPrompt(question: string, context: string): string {
    if (!context) {
      return `Question: ${question}\n\nPlease answer this question based on your general knowledge.`;
    }

    return `Context Information:\n${context}\n\nQuestion: ${question}\n\nPlease answer this question based on the provided context. If the context doesn't contain enough information to fully answer the question, use the context but also mention what additional information might be helpful.`;
  }

  private extractSources(context: string): string[] {
    if (!context) return [];
    
    // Extract source information from context chunks
    const sources: string[] = [];
    const contextLines = context.split('\n');
    
    for (const line of contextLines) {
      if (line.startsWith('[Context')) {
        sources.push(line.trim());
      }
    }
    
    return sources.length > 0 ? sources : ['file.txt'];
  }

  async getServiceStatus() {
    const ragStatus = this.ragService.getStatus();
    return {
      llmAvailable: !!this.mistralClient,
      ragStatus,
      timestamp: new Date().toISOString()
    };
  }
}
