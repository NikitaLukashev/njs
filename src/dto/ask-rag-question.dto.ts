import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class AskRagQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  question: string;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  contextChunks?: number = 3;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  includeMetadata?: boolean = false;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  useRag?: boolean = true;
}
