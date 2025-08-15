import { Controller, Post, Body, Get, HttpException, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { LlmRagService } from '../services/llm-rag.service';
import { AskLlmQuestionDto } from '../dto/ask-llm-question.dto';
import { QuestionResponse } from '../services/llm-rag.service';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery,
  ApiOperationOptions,
  ApiResponseOptions 
} from '@nestjs/swagger';

@ApiTags('LLM RAG')
@Controller('llm-rag')
export class LlmRagController {
  constructor(private readonly llmRagService: LlmRagService) {}

  @Post('ask')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Ask a question with RAG',
    description: `
      Ask any question and get an AI-powered answer using Retrieval-Augmented Generation (RAG).
      
      The system will:
      1. Find relevant context from your document data
      2. Generate an intelligent response using Mistral AI
      3. Return the answer along with the context used
      
      **Note**: Requires a valid Mistral AI API key to be configured.
    `
  } as ApiOperationOptions)
  @ApiBody({
    type: AskLlmQuestionDto,
    description: 'Question request with optional parameters',
    examples: {
      basic: {
        summary: 'Basic question',
        value: {
          question: 'What amenities does the apartment offer?'
        }
      },
      advanced: {
        summary: 'Advanced question with parameters',
        value: {
          question: 'What are the check-in and check-out times?',
          maxContextChunks: 2,
          temperature: 0.5
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated answer using RAG',
    schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          description: 'AI-generated answer based on retrieved context',
          example: 'Based on the listing information, the apartment offers modern amenities including...'
        },
        context: {
          type: 'string',
          description: 'Relevant context chunks used to generate the answer',
          example: '[Context 1]\nThe apartment includes all the modern amenities of the 21st century...'
        },
        sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Source identifiers for the context chunks used',
          example: ['[Context 1]', '[Context 2]']
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Timestamp when the response was generated',
          example: '2025-08-15T16:56:14.930Z'
        }
      }
    }
  } as ApiResponseOptions)
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid question or parameters',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Question is required' },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error or LLM service unavailable',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Internal server error while processing your question' },
        error: { type: 'string', example: 'Internal Server Error' },
        statusCode: { type: 'number', example: 500 }
      }
    }
  })
  async askQuestion(@Body() request: AskLlmQuestionDto): Promise<QuestionResponse> {
    try {
      return await this.llmRagService.askQuestion(request);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Error in LLM RAG controller:', error);
      throw new HttpException(
        'Internal server error while processing your question',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get service status',
    description: `
      Check the current status of the LLM RAG service including:
      - LLM availability (Mistral AI connection)
      - RAG system status and document chunk count
      - Data path and embeddings status
      - Last update timestamp
    `
  } as ApiOperationOptions)
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved service status',
    schema: {
      type: 'object',
      properties: {
        llmAvailable: {
          type: 'boolean',
          description: 'Whether the Mistral AI service is available',
          example: true
        },
        ragStatus: {
          type: 'object',
          properties: {
            initialized: {
              type: 'boolean',
              description: 'Whether the RAG system is initialized',
              example: true
            },
            chunkCount: {
              type: 'number',
              description: 'Number of document chunks available',
              example: 9
            },
            dataPath: {
              type: 'string',
              description: 'Path to the data file being used',
              example: '/Users/username/Documents/njs/ts/data/file.txt'
            },
            embeddingsEnabled: {
              type: 'boolean',
              description: 'Whether embeddings are enabled and working',
              example: true
            }
          }
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Timestamp when the status was checked',
          example: '2025-08-15T16:56:14.930Z'
        }
      }
    }
  } as ApiResponseOptions)
  @ApiResponse({
    status: 500,
    description: 'Error getting service status',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error getting service status' },
        error: { type: 'string', example: 'Internal Server Error' },
        statusCode: { type: 'number', example: 500 }
      }
    }
  })
  async getServiceStatus() {
    try {
      return await this.llmRagService.getServiceStatus();
    } catch (error) {
      console.error('Error getting service status:', error);
      throw new HttpException(
        'Error getting service status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
