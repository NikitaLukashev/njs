# LLM RAG Endpoint Setup

## Prerequisites

1. **Mistral AI API Key**: Get your API key from [Mistral Console](https://console.mistral.ai/)
2. **Environment Variables**: Create a `.env` file in the `ts/` directory

## Environment Setup

Create a `.env` file in the `ts/` directory with:

```bash
MISTRAL_API_KEY=your_actual_mistral_api_key_here
```

## Features

### 1. Ask Questions Endpoint
- **POST** `/llm-rag/ask`
- **Body**: 
  ```json
  {
    "question": "What amenities does the apartment offer?",
    "maxContextChunks": 3,
    "temperature": 0.7
  }
  ```

### 2. Service Status Endpoint
- **GET** `/llm-rag/status`
- Returns RAG system status and LLM availability

## How It Works

1. **Question Processing**: Your question is received via the API
2. **RAG Retrieval**: The system finds relevant context from your document data
3. **LLM Generation**: Mistral AI generates an answer using the retrieved context
4. **Response**: You get the answer along with the context used

## Example Usage

```bash
# Ask a question about the apartment
curl -X POST http://localhost:3000/llm-rag/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the check-in and check-out times?",
    "maxContextChunks": 2
  }'

# Check service status
curl http://localhost:3000/llm-rag/status
```

## Response Format

```json
{
  "answer": "Based on the listing information...",
  "context": "[Context 1]\nCheck-in between 3:00 PM - 8:00 PM...",
  "sources": ["[Context 1]", "[Context 2]"],
  "timestamp": "2025-01-15T..."
}
```

## Troubleshooting

- **API Key Error**: Ensure your Mistral API key is correctly set in `.env`
- **RAG Not Initialized**: Check if the data file exists at `ts/data/file.txt`
- **Service Unavailable**: Verify the server is running and all services are loaded
