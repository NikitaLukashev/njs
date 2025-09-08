import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';
import * as fs from 'fs';

const configService = new ConfigService();
const apiKey = configService.get<string>('MISTRAL_API_KEY')||("16CPDv68H5Yu45oifrm4zMKve6a1T9uw");
const model = configService.get<string>('MISTRAL_MODEL') || ('mistral-large-latest');
console.log(apiKey);
const client = new Mistral({apiKey});





// const training_file = fs.readFileSync('../data/ultrachat_chunk_train.jsonl');
const validation_file = fs.readFileSync('../data/ultrachat_chunk_eval.jsonl');

async function uploadFiles() {
    /*const training_data = await client.files.upload({
        file: {
            fileName: "training_file.jsonl",
            content: training_file,
        }
    });
    */

    const validation_data = await client.files.upload({
        file: {
            fileName: "validation_file.jsonl",
            content: validation_file,
        }
    });
    
    //console.log('Training file ID:', training_data.id);
    console.log('Validation file ID:', validation_data.id);
    
    return {validation_data };
}

// Call the function
uploadFiles();


/*

function uploadFiles(file: string) {
    const rows = [];
    
    const fileContent = fs.readFileSync(file, 'utf8');
    const lines = fileContent.split('\n');
    
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
//const ultrachat_chunk_eval = uploadFiles();

// First upload the files to get file IDs
async function createFineTuningJob() {
    try {
        // Upload training file to Mistral
        const trainingFilePath = '../data/ultrachat_chunk_train.jsonl';
        const uploadedTrainingFile = await uploadFiles(trainingFilePath)

        
        // Upload validation file to Mistral
        const validationFilePath = '../data/ultrachat_chunk_eval.jsonl';
        const uploadedValidationFile = await uploadFiles(validationFilePath);
        
        console.log('Training file ID:', uploadedTrainingFile[0].prompt_id, uploadedTrainingFile[1].prompt_id);
        console.log('Validation file ID:', uploadedValidationFile[2].prompt_id, uploadedValidationFile[3].prompt_id);
        
        // Create fine-tuning job with actual file IDs
        const createdJob = await client.fineTuning.jobs.create({
            model: model || 'mistral-large-latest',
            trainingFiles: [uploadedTrainingFile[0].prompt_id, uploadedTrainingFile[1].prompt_id],
            // validationFiles: [uploadedValidationFile[2].prompt_id, uploadedValidationFile[3].prompt_id],
            hyperparameters: {
                trainingSteps: 10,
                learningRate: 0.0001,
            },
        });
        
        console.log('Fine-tuning job created:', createdJob);
        return createdJob;
    } catch (error) {
        console.error('Error creating fine-tuning job:', error);
    }
}

// Call the function
createFineTuningJob();


//
// 
// 
// 
// 
// console.log(ultrachat_chunk_eval[0]);
*/