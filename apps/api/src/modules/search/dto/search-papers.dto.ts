import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { SearchSource } from '../types/unified-paper';

export class SearchFiltersDto {
  @IsOptional() @IsInt() @Min(1900) @Max(2100) yearFrom?: number;
  @IsOptional() @IsInt() @Min(1900) @Max(2100) yearTo?: number;
  @IsOptional() @IsBoolean() openAccess?: boolean;
  @IsOptional() @IsString() author?: string;
  @IsOptional() @IsString() journal?: string;
}

const VALID_SOURCES: SearchSource[] = [
  'openalex',
  'crossref',
  'semantic_scholar',
  'pubmed',
  'arxiv',
];

export class SearchPapersDto {
  @IsString()
  @MinLength(2)
  query!: string;

  @IsOptional()
  @IsArray()
  @IsEnum(VALID_SOURCES, { each: true })
  sources?: SearchSource[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;
}
