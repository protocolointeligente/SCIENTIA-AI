import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export enum FichamentoLanguage {
  PT = 'pt',
  EN = 'en',
}

export class CreateFichamentoDto {
  @IsUUID()
  paperId!: string;

  @IsOptional()
  @IsEnum(FichamentoLanguage)
  language?: FichamentoLanguage = FichamentoLanguage.PT;

  @IsOptional()
  @IsString()
  customPrompt?: string;
}
