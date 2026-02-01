import { ObjectType, Field, ID, registerEnumType } from "@nestjs/graphql";
import { ContentType, Category, Status, Source } from "@shared/enums";

// Register enums for GraphQL
registerEnumType(ContentType, {
  name: "ContentType",
  description: "Type of content",
});

registerEnumType(Source, {
  name: "Source",
  description: "Content source",
});

/**
 * Pure interface for service layer
 */
export interface ContentGraphQL {
  id: string;
  programId?: string;
  title: string;
  description?: string;
  type: ContentType;
  category: Category;
  language: string;
  status: Status;
  source: Source;
  externalId?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  duration?: number;
  thumbnailUrl?: string;
}

/**
 * GraphQL ObjectType with decorators
 */
@ObjectType({ description: "A piece of content (episode, video, etc.)" })
export class ContentGraphQLType implements ContentGraphQL {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true })
  programId?: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ContentType)
  type: ContentType;

  @Field(() => Category)
  category: Category;

  @Field()
  language: string;

  @Field(() => Status)
  status: Status;

  @Field(() => Source)
  source: Source;

  @Field({ nullable: true })
  externalId?: string;

  @Field(() => Date, { nullable: true })
  publishedAt?: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Metadata fields exposed individually for GraphQL
  @Field({ nullable: true })
  duration?: number;

  @Field({ nullable: true })
  thumbnailUrl?: string;
}
