import { ObjectType, Field, ID, registerEnumType } from "@nestjs/graphql";
import { ProgramType, Category, Status } from "@shared/enums";
import { ContentGraphQLType } from "../content/content.type";

// Register enums for GraphQL
registerEnumType(ProgramType, {
  name: "ProgramType",
  description: "Type of program",
});

registerEnumType(Category, {
  name: "Category",
  description: "Content category",
});

registerEnumType(Status, {
  name: "Status",
  description: "Publication status",
});

/**
 * Pure interface for service layer
 */
export interface ProgramGraphQL {
  id: string;
  title: string;
  description?: string;
  type: ProgramType;
  category: Category;
  language: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
  contents?: ContentGraphQLType[];
  contentCount?: number;
}

/**
 * GraphQL ObjectType with decorators
 */
@ObjectType({ description: "A program (podcast series, documentary series, etc.)" })
export class ProgramGraphQLType implements ProgramGraphQL {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ProgramType)
  type: ProgramType;

  @Field(() => Category)
  category: Category;

  @Field()
  language: string;

  @Field(() => Status)
  status: Status;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [ContentGraphQLType], { nullable: true })
  contents?: ContentGraphQLType[];

  @Field({ nullable: true })
  contentCount?: number;
}
