# NestJS LLM RAG API - Development Setup

A simplified NestJS application that combines Large Language Models (LLM) with Retrieval-Augmented Generation (RAG) to automaticcally answer in whatsapp to Airbnb Guest questions.

## Features

- **LLM Integration**: Powered by Mistral AI for intelligent responses
- **RAG System**: Retrieves relevant context from document embeddings using ChromaDB
- **Document Processing**: Automatic chunking and embedding generation
- **Real-time Q&A**: Ask questions and get context-aware answers
- **Whatsapp**: Integration through Twilio to answer on guest whatsapp phone number
## Development Setup


1. **Set up environment variables:**
   Create a `.env` file in the root directory with:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   MISTRAL_API_URL=https://api.mistral.ai/v1/chat/completions
   MISTRAL_MODEL=mistral-large-latest
   CHROMA_HOST=localhost
   CHROMA_PORT=8000
   ```

2. **Start with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

   This will start both ChromaDB and your NestJS app automatically in containers.

The API will be available at `http://localhost:3000` with Swagger documentation at `http://localhost:3000/api`.

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run start:dev` - Start development server with hot reload
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests

## Docker Development

- `docker-compose up --build` - Start development environment (both ChromaDB and app)
- `docker-compose down` - Stop development environment
- `docker-compose logs -f app` - View app logs
- `docker-compose logs -f chromadb` - View ChromaDB logs
- `docker-compose restart` - Restart all services

## API Endpoints

- `GET /` - Health check
- `POST /llm-rag/ask` - Ask questions using LLM + RAG
- `GET /llm-rag/status` - Get service status (LLM availability, RAG status, document count)
- `POST /whatsapp` - Handle WhatsApp messages via Twilio webhook

## Project Structure

```
src/
├── controllers/     # API endpoints
├── services/        # Business logic
├── dto/            # Data transfer objects
└── openapi/        # API documentation
```

## Production deployment
You should configure Twilio and Ngrok api endpoint to forward LLM response to your guest whatsapp phone number.