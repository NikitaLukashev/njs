import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RagService } from './services/rag.service';
import { LlmRagService } from './services/llm-rag.service';
import { LlmRagController } from './controllers/llm-rag.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController, LlmRagController],
  providers: [AppService, RagService, LlmRagService],
})
export class AppModule {}
