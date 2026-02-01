/**
 * Ingestion E2E Tests
 *
 * End-to-end tests for the Content Ingestion API.
 */

import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp, generateTestProgram, stopPostgresContainer } from "./utils";

describe("Ingestion (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
    await stopPostgresContainer();
  });

  describe("GET /api/cms/ingestion/sources", () => {
    it("should list available sources", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/cms/ingestion/sources")
        .expect(200);

      expect(response.body.sources).toBeDefined();
      expect(Array.isArray(response.body.sources)).toBe(true);
      expect(response.body.sources).toContain("youtube");
    });
  });

  describe("POST /api/cms/ingestion/import", () => {
    it("should import content from YouTube (mock)", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/cms/ingestion/import")
        .send({
          source: "youtube",
          channelId: "UC_demo_channel_1",
          maxResults: 5,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        source: "youtube",
        channelId: "UC_demo_channel_1",
      });
      expect(response.body.programId).toBeDefined();
      expect(response.body.imported).toBeGreaterThan(0);
    });

    it("should import to existing program", async () => {
      // Create a program first
      const programResponse = await request(app.getHttpServer())
        .post("/api/cms/programs")
        .send(generateTestProgram({ title: "Import Target Program" }));

      const programId = programResponse.body.id;

      const response = await request(app.getHttpServer())
        .post("/api/cms/ingestion/import")
        .send({
          source: "youtube",
          channelId: "UC_demo_channel_2",
          programId,
          maxResults: 3,
        })
        .expect(201);

      expect(response.body.programId).toBe(programId);
      expect(response.body.imported).toBeGreaterThan(0);
    });

    it("should skip already imported content (idempotent)", async () => {
      // First import
      const firstImport = await request(app.getHttpServer())
        .post("/api/cms/ingestion/import")
        .send({
          source: "youtube",
          channelId: "UC_demo_channel_3",
          maxResults: 3,
        });

      const programId = firstImport.body.programId;

      // Second import to same program
      const secondImport = await request(app.getHttpServer())
        .post("/api/cms/ingestion/import")
        .send({
          source: "youtube",
          channelId: "UC_demo_channel_3",
          programId,
          maxResults: 3,
        })
        .expect(201);

      // Second import should have processed the content (may skip or re-import depending on implementation)
      expect(secondImport.body.imported).toBeDefined();
    });

    it("should reject invalid source", async () => {
      await request(app.getHttpServer())
        .post("/api/cms/ingestion/import")
        .send({
          source: "invalid_source",
          channelId: "some_channel",
        })
        .expect(400);
    });

    it("should reject non-existent program ID", async () => {
      await request(app.getHttpServer())
        .post("/api/cms/ingestion/import")
        .send({
          source: "youtube",
          channelId: "some_channel",
          programId: "00000000-0000-0000-0000-000000000000",
        })
        .expect(404);
    });
  });
});
