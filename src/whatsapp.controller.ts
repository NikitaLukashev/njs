import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { LlmRagService } from './services/llm-rag.service';

const twilio = require('twilio');

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly llmRagService: LlmRagService) {}

  @Post()
  async handleWhatsAppMessage(@Body() message: any, @Res() res: Response) {
    try {
      // Log the received message details
      console.log(`Received message from: ${message.From}`);
      console.log(`Message Body: ${message.Body}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);

      // Create TwiML response
      const twiml = new twilio.twiml.MessagingResponse();

      const questionRequest = {question: message.Body, maxContextChunks: 10, temperature: 0.5}
      const tmp = await this.llmRagService.askQuestion(questionRequest)
      
      twiml.message(tmp.answer);

      // Respond with TwiML
      res.type('text/xml').send(twiml.toString());

    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error processing message');
    }
  }
}
