import { Mistral } from '@mistralai/mistralai';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as readline from 'readline';

const configService = new ConfigService();
const apiKey = configService.get<string>('MISTRAL_API_KEY');
const model = configService.get<string>('MISTRAL_MODEL');
const client = new Mistral({apiKey});

function uploadFiles() {
    const rows = [];
    
    const file = fs.readFileSync('../data/ultrachat_chunk_eval.jsonl', 'utf8');
    const lines = file.split('\n');
    
    for (const line of lines) {
        if (line.trim() === '') continue;
        try {
            const user = JSON.parse(line);
            rows.push(user);
        } catch (error) {
            console.error(`Error parsing line: "${line}"`, error);
        }
    }
    
    return rows;
}







// Call the function
const ultrachat_chunk_eval = uploadFiles();

const createdJob = client.fineTuning.createJob({
    model: model,
    trainingFiles: [ultrachat_chunk_eval.prompt_id],
    validationFiles: [ultrachat_chunk_eval.prompt_id],
    hyperparameters: {
      trainingSteps: 10,
      learningRate: 0.0001,
    },
  });

console.log(ultrachat_chunk_eval[0]);
