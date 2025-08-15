import { IsString, IsOptional, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

export class AskLlmQuestionDto {
  @ApiProperty({
    description: 'The question you want to ask the AI assistant',
    example: 'What amenities does the apartment offer?',
    minLength: 1,
    maxLength: 1000
  } as ApiPropertyOptions)
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  question: string;

  @ApiProperty({
    description: 'Maximum number of context chunks to retrieve for answering the question',
    example: 3,
    minimum: 1,
    maximum: 10,
    default: 3,
    required: false
  } as ApiPropertyOptions)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => parseInt(value))
  maxContextChunks?: number = 3;

  @ApiProperty({
    description: 'Controls the randomness of the AI response. Lower values make responses more focused, higher values make them more creative',
    example: 0.7,
    minimum: 0,
    maximum: 2,
    default: 0.7,
    required: false
  } as ApiPropertyOptions)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  @Transform(({ value }) => parseFloat(value))
  temperature?: number = 0.7;
}
