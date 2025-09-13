import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';
import * as fs from 'fs';

export interface FineTuningJobConfig {
  trainingFiles: string[];
  validationFiles?: string[];
  hyperparameters?: {
    trainingSteps?: number;
    learningRate?: number;
  };
}

export interface UploadedFile {
  id: string;
  fileName: string;
}

export interface FineTuningJob {
  id: string;
  model: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  trainingFiles: string[];
  validationFiles?: string[];
  hyperparameters: {
    trainingSteps: number;
    learningRate: number;
  };
  createdAt: string;
  finishedAt?: string;
  error?: {
    message: string;
    code: string;
  };
}

export interface MistralFileUpload {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

@Injectable()
export class FinetuningService {
  private readonly client: Mistral;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('MISTRAL_API_KEY');
    this.model = this.configService.get<string>('MISTRAL_MODEL') || 'mistral-large-latest';
    this.client = new Mistral({ apiKey });
  }

  async uploadValidationFile(filePath: string = '../data/ultrachat_chunk_eval.jsonl'): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Validation file not found at path: ${filePath}`);
    }

    const validationFile = fs.readFileSync(filePath);
    
    const validationData = await this.client.files.upload({
      file: {
        fileName: "validation_file.jsonl",
        content: validationFile,
      }
    });
    
    return validationData.id;
  }

  async uploadTrainingFile(filePath: string = '../data/ultrachat_chunk_train.jsonl'): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Training file not found at path: ${filePath}`);
    }

    const trainingFile = fs.readFileSync(filePath);
    
    const trainingData = await this.client.files.upload({
      file: {
        fileName: "training_file.jsonl",
        content: trainingFile,
      }
    });
    
    return trainingData.id;
  }

  private parseJsonlFile(filePath: string): any[] {
    const rows = [];
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      try {
        const parsedLine = JSON.parse(line);
        rows.push(parsedLine);
      } catch (error) {
        throw new Error(`Error parsing line in ${filePath}: ${error.message}`);
      }
    }
    
    return rows;
  }

  async createFineTuningJob(config: FineTuningJobConfig): Promise<FineTuningJob> {
    const jobConfig: any = {
      model: this.model,
      trainingFiles: config.trainingFiles,
      hyperparameters: {
        trainingSteps: 10,
        learningRate: 0.0001,
        ...config.hyperparameters,
      },
    };

    if (config.validationFiles && config.validationFiles.length > 0) {
      jobConfig.validationFiles = config.validationFiles;
    }

    const createdJob = await this.client.fineTuning.jobs.create(jobConfig);
    return createdJob as FineTuningJob;
  }

  async getFineTuningJob(jobId: string): Promise<FineTuningJob> {
    const job = await this.client.fineTuning.jobs.retrieve(jobId);
    return job as FineTuningJob;
  }

  async listFineTuningJobs(): Promise<FineTuningJob[]> {
    const jobs = await this.client.fineTuning.jobs.list();
    return jobs.data as FineTuningJob[];
  }
}