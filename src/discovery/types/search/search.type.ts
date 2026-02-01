/**
 * Search Types
 */

import { ObjectType, Field, InputType, Int, registerEnumType } from "@nestjs/graphql";
import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsArray } from "class-validator";
import { ContentType, Category, ProgramType } from "../../../shared/enums";
import { ContentGraphQLType } from "../content/content.type";
import { ProgramGraphQLType } from "../program/program.type";

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export enum SortField {
  RELEVANCE = "relevance",
  CREATED_AT = "created_at",
  PUBLISHED_AT = "published_at",
  TITLE = "title",
}

registerEnumType(SortOrder, {
  name: "SortOrder",
  description: "Sort order direction",
});

registerEnumType(SortField, {
  name: "SortField",
  description: "Field to sort by",
});

/**
 * Pure interface for service layer
 */
export interface SearchInputData {
  query?: string;
  categories?: Category[];
  contentTypes?: ContentType[];
  programTypes?: ProgramType[];
  language?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
}

/**
 * GraphQL InputType with decorators
 */
@InputType()
export class SearchInput implements SearchInputData {
  @Field({ nullable: true, description: "Search query text" })
  @IsOptional()
  @IsString()
  query?: string;

  @Field(() => [Category], { nullable: true, description: "Filter by categories" })
  @IsOptional()
  @IsArray()
  categories?: Category[];

  @Field(() => [ContentType], { nullable: true, description: "Filter by content types" })
  @IsOptional()
  @IsArray()
  contentTypes?: ContentType[];

  @Field(() => [ProgramType], { nullable: true, description: "Filter by program types" })
  @IsOptional()
  @IsArray()
  programTypes?: ProgramType[];

  @Field({ nullable: true, description: "Filter by language code" })
  @IsOptional()
  @IsString()
  language?: string;

  @Field(() => SortField, { nullable: true, defaultValue: SortField.RELEVANCE })
  @IsOptional()
  @IsEnum(SortField)
  sortBy?: SortField;

  @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

/**
 * Search result item interface
 */
export interface SearchResultItemData {
  content?: ContentGraphQLType;
  program?: ProgramGraphQLType;
  score: number;
}

@ObjectType()
export class SearchResultItem implements SearchResultItemData {
  @Field(() => ContentGraphQLType, { nullable: true })
  content?: ContentGraphQLType;

  @Field(() => ProgramGraphQLType, { nullable: true })
  program?: ProgramGraphQLType;

  @Field({ description: "Search relevance score" })
  score: number;
}

/**
 * Search result interface
 */
export interface SearchResultData {
  items: SearchResultItemData[];
  total: number;
  limit: number;
  offset: number;
  query?: string;
}

@ObjectType()
export class SearchResult implements SearchResultData {
  @Field(() => [SearchResultItem])
  items: SearchResultItem[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  offset: number;

  @Field({ nullable: true })
  query?: string;
}

/**
 * Paginated programs interface
 */
export interface PaginatedProgramsData {
  items: ProgramGraphQLType[];
  total: number;
  limit: number;
  offset: number;
}

@ObjectType()
export class PaginatedPrograms implements PaginatedProgramsData {
  @Field(() => [ProgramGraphQLType])
  items: ProgramGraphQLType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  offset: number;
}

/**
 * Paginated contents interface
 */
export interface PaginatedContentsData {
  items: ContentGraphQLType[];
  total: number;
  limit: number;
  offset: number;
}

@ObjectType()
export class PaginatedContents implements PaginatedContentsData {
  @Field(() => [ContentGraphQLType])
  items: ContentGraphQLType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  offset: number;
}
