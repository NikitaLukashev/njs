import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('NestJS LLM RAG API')
    .setDescription(`
      A comprehensive API service that combines Large Language Models (LLM) with Retrieval-Augmented Generation (RAG) capabilities.
      
      ## Features
      - **LLM Integration**: Powered by Mistral AI for intelligent responses
      - **RAG System**: Retrieves relevant context from document embeddings
      - **Document Processing**: Automatic chunking and embedding generation
      - **Real-time Q&A**: Ask questions and get context-aware answers
      
      ## How It Works
      1. **Question Processing**: Your question is received via the API
      2. **RAG Retrieval**: The system finds relevant context from your document data
      3. **LLM Generation**: Mistral AI generates an answer using the retrieved context
      4. **Response**: You get the answer along with the context used
      
      ## Authentication
      Requires a valid Mistral AI API key set in the environment variables.
    `)
    .setVersion('1.0.0')
    .addTag('Core', 'Basic application endpoints')
    .addTag('LLM RAG', 'AI-powered question answering with RAG capabilities')
    .addTag('Health', 'Service status and health monitoring')
    .addServer('http://localhost:3000', 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'NestJS LLM RAG API Documentation',
  });

  return document;
}
