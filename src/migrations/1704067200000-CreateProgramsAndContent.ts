import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProgramsAndContent1704067200000 implements MigrationInterface {
  name = "CreateProgramsAndContent1704067200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "program_type_enum" AS ENUM ('podcast', 'series', 'channel')
    `);

    await queryRunner.query(`
      CREATE TYPE "content_type_enum" AS ENUM ('episode', 'video', 'article')
    `);

    await queryRunner.query(`
      CREATE TYPE "category_enum" AS ENUM (
        'technology', 'business', 'science', 'education', 'entertainment',
        'health', 'sports', 'news', 'culture', 'lifestyle', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "status_enum" AS ENUM ('draft', 'review', 'published', 'archived')
    `);

    await queryRunner.query(`
      CREATE TYPE "source_enum" AS ENUM ('manual', 'youtube', 'rss', 'api')
    `);

    // Create programs table
    await queryRunner.query(`
      CREATE TABLE "programs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(255) NOT NULL,
        "description" text,
        "type" "program_type_enum" NOT NULL DEFAULT 'podcast',
        "cover_image_url" varchar(500),
        "author" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb DEFAULT '{}',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create content table
    await queryRunner.query(`
      CREATE TABLE "content" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "program_id" uuid NOT NULL REFERENCES "programs"("id") ON DELETE CASCADE,
        "title" varchar(500) NOT NULL,
        "description" text,
        "type" "content_type_enum" NOT NULL DEFAULT 'episode',
        "category" "category_enum" NOT NULL DEFAULT 'other',
        "status" "status_enum" NOT NULL DEFAULT 'draft',
        "source" "source_enum" NOT NULL DEFAULT 'manual',
        "language" varchar(10) NOT NULL DEFAULT 'ar',
        "external_id" varchar(255),
        "media_url" varchar(500),
        "metadata" jsonb DEFAULT '{}',
        "published_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "idx_content_program_id" ON "content"("program_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_content_status" ON "content"("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_content_category" ON "content"("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_content_type" ON "content"("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_content_language" ON "content"("language")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_content_published_at" ON "content"("published_at") WHERE "status" = 'published'
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_content_external_id" ON "content"("external_id") WHERE "external_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_programs_type" ON "programs"("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_programs_is_active" ON "programs"("is_active")
    `);

    // Full text search indexes (PostgreSQL specific)
    await queryRunner.query(`
      CREATE INDEX "idx_content_title_fts" ON "content" USING GIN (to_tsvector('arabic', "title"))
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_programs_title_fts" ON "programs" USING GIN (to_tsvector('arabic', "title"))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_programs_title_fts"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_title_fts"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_programs_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_programs_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_external_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_published_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_language"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_program_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "content"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "programs"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "source_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "program_type_enum"`);
  }
}
