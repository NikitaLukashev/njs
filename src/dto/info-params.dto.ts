import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum InfoType {
  USER = 'user',
  SYSTEM = 'system',
  API = 'api',
}

export class InfoParamsDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(InfoType)
  @IsOptional()
  type?: InfoType;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @Transform(({ value }) => value === 'true')
  @IsOptional()
  detailed?: boolean;
}
