# NestJS LLM RAG API - Development Setup

A simplified NestJS application that combines Large Language Models (LLM) with Retrieval-Augmented Generation (RAG) capabilities for development purposes.

## Features

- **LLM Integration**: Powered by Mistral AI for intelligent responses
- **RAG System**: Retrieves relevant context from document embeddings using ChromaDB
- **Document Processing**: Automatic chunking and embedding generation
- **Real-time Q&A**: Ask questions and get context-aware answers

## Development Setup

### Option 1: Docker Compose (Recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   MISTRAL_API_URL=https://api.mistral.ai/v1/chat/completions
   MISTRAL_MODEL=mistral-large-latest
   CHROMA_HOST=localhost
   CHROMA_PORT=8000
   ```

3. **Start with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

   This will start both ChromaDB and your NestJS app automatically in containers.

### Option 2: Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   MISTRAL_API_URL=https://api.mistral.ai/v1/chat/completions
   MISTRAL_MODEL=mistral-large-latest
   CHROMA_HOST=localhost
   CHROMA_PORT=8000
   ```

3. **Start ChromaDB (for development):**
   ```bash
   # Using Docker (simplest way)
   docker run -p 8000:8000 chromadb/chroma:latest
   
   # Or install and run ChromaDB locally
   ```

4. **Start the development server:**
   ```bash
   npm run start:dev
   ```

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
- `POST /llm-rag/process-document` - Process and embed documents

## Project Structure

```
src/
├── controllers/     # API endpoints
├── services/        # Business logic
├── dto/            # Data transfer objects
└── openapi/        # API documentation
```

## Notes

- This is a development-only setup
- ChromaDB is used for local development and testing
- No production build or deployment configurations included
- Simplified configuration for faster development iteration
- Docker Compose setup includes hot reload for both app and ChromaDB
