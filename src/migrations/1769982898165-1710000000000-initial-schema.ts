import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1710000000000 implements MigrationInterface {
  name = "InitialSchema1710000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."programs_type_enum" AS ENUM('podcast_series','documentary_series')`);
    await queryRunner.query(`CREATE TYPE "public"."programs_category_enum" AS ENUM('technology','culture','business','society','entertainment')`);
    await queryRunner.query(`CREATE TYPE "public"."programs_status_enum" AS ENUM('draft','published','archived')`);
    await queryRunner.query(`CREATE TABLE "programs" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "title" character varying(255) NOT NULL,
      "description" text,
      "type" "public"."programs_type_enum" NOT NULL,
      "category" "public"."programs_category_enum" NOT NULL,
      "language" character varying(10) NOT NULL DEFAULT 'ar',
      "status" "public"."programs_status_enum" NOT NULL DEFAULT 'draft',
      "metadata" jsonb,
      "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('arabic', COALESCE(title,'') || ' ' || COALESCE(description,''))) STORED,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT "PK_programs" PRIMARY KEY ("id")
    )`);

    await queryRunner.query(`CREATE TYPE "public"."content_type_enum" AS ENUM('podcast_episode','documentary_episode','standalone_video')`);
    await queryRunner.query(`CREATE TYPE "public"."content_category_enum" AS ENUM('technology','culture','business','society','entertainment')`);
    await queryRunner.query(`CREATE TYPE "public"."content_status_enum" AS ENUM('draft','published','archived')`);
    await queryRunner.query(`CREATE TYPE "public"."content_source_enum" AS ENUM('manual','youtube','rss')`);
    await queryRunner.query(`CREATE TABLE "content" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "program_id" uuid,
      "title" character varying(500) NOT NULL,
      "description" text,
      "type" "public"."content_type_enum" NOT NULL,
      "category" "public"."content_category_enum" NOT NULL,
      "language" character varying(10) NOT NULL DEFAULT 'ar',
      "status" "public"."content_status_enum" NOT NULL DEFAULT 'draft',
      "source" "public"."content_source_enum" NOT NULL DEFAULT 'manual',
      "external_id" character varying(255),
      "metadata" jsonb,
      "published_at" TIMESTAMP WITH TIME ZONE,
      "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('arabic', COALESCE(title,'') || ' ' || COALESCE(description,''))) STORED,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT "PK_content" PRIMARY KEY ("id")
    )`);

    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_content_external_source" ON "content" ("source", "external_id") WHERE "external_id" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_content_program" ON "content" ("program_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_content_filters" ON "content" ("category", "type", "language", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_content_published" ON "content" ("id") WHERE "status" = 'published'`);
    await queryRunner.query(`CREATE INDEX "IDX_content_search" ON "content" USING GIN("search_vector")`);
    await queryRunner.query(`CREATE INDEX "IDX_program_search" ON "programs" USING GIN("search_vector")`);

    await queryRunner.query(`ALTER TABLE "content" ADD CONSTRAINT "FK_content_program" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "content" DROP CONSTRAINT "FK_content_program"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_program_search"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_content_search"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_content_published"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_content_filters"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_content_program"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_content_external_source"`);
    await queryRunner.query(`DROP TABLE "content"`);
    await queryRunner.query(`DROP TYPE "public"."content_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."content_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."content_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."content_type_enum"`);
    await queryRunner.query(`DROP TABLE "programs"`);
    await queryRunner.query(`DROP TYPE "public"."programs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."programs_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."programs_type_enum"`);
  }
}
