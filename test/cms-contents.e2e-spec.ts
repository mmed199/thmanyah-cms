/**
 * CMS Contents E2E Tests
 *
 * End-to-end tests for the Contents REST API.
 */

import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp, generateTestProgram, generateTestContent, stopAllContainers } from "./utils";

describe("CMS Contents (e2e)", () => {
  let app: INestApplication;
  let testProgramId: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Create a program for content tests
    const programResponse = await request(app.getHttpServer())
      .post("/api/cms/programs")
      .send(generateTestProgram({ title: "Content Test Program" }));
    testProgramId = programResponse.body.id;
  });

  afterAll(async () => {
    await app?.close();
    await stopAllContainers();
  });

  describe("POST /api/cms/contents", () => {
    it("should create content", async () => {
      const content = generateTestContent({ programId: testProgramId });

      const response = await request(app.getHttpServer())
        .post("/api/cms/contents")
        .send(content)
        .expect(201);

      expect(response.body).toMatchObject({
        title: content.title,
        description: content.description,
        type: content.type,
        category: content.category,
        programId: testProgramId,
        status: "draft",
      });
      expect(response.body.id).toBeDefined();
    });

    it("should create standalone content without program", async () => {
      const content = generateTestContent({ title: "Standalone Content" });

      const response = await request(app.getHttpServer())
        .post("/api/cms/contents")
        .send(content)
        .expect(201);

      expect(response.body.programId).toBeNull();
    });

    it("should reject invalid program ID", async () => {
      const content = generateTestContent({
        programId: "00000000-0000-0000-0000-000000000000",
      });

      await request(app.getHttpServer()).post("/api/cms/contents").send(content).expect(404);
    });
  });

  describe("GET /api/cms/contents", () => {
    it("should list contents", async () => {
      const response = await request(app.getHttpServer()).get("/api/cms/contents").expect(200);

      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("should filter by program ID", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/cms/contents")
        .query({ programId: testProgramId })
        .expect(200);

      response.body.items.forEach((item: any) => {
        expect(item.programId).toBe(testProgramId);
      });
    });

    it("should filter by category", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/cms/contents")
        .query({ category: "technology" })
        .expect(200);

      response.body.items.forEach((item: any) => {
        expect(item.category).toBe("technology");
      });
    });
  });

  describe("PUT /api/cms/contents/:id", () => {
    it("should update content", async () => {
      // Create content first
      const createResponse = await request(app.getHttpServer())
        .post("/api/cms/contents")
        .send(generateTestContent({ title: "Original Content Title" }));

      const contentId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .put(`/api/cms/contents/${contentId}`)
        .send({ title: "Updated Content Title" })
        .expect(200);

      expect(response.body.title).toBe("Updated Content Title");
    });
  });

  describe("POST /api/cms/contents/:id/publish", () => {
    it("should publish content", async () => {
      // Create content first
      const createResponse = await request(app.getHttpServer())
        .post("/api/cms/contents")
        .send(generateTestContent());

      const contentId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .post(`/api/cms/contents/${contentId}/publish`)
        .expect(201);

      expect(response.body.status).toBe("published");
      expect(response.body.publishedAt).toBeDefined();
    });
  });

  describe("POST /api/cms/contents/:id/archive", () => {
    it("should archive published content", async () => {
      // Create and publish content first
      const createResponse = await request(app.getHttpServer())
        .post("/api/cms/contents")
        .send(generateTestContent());

      const contentId = createResponse.body.id;

      await request(app.getHttpServer()).post(`/api/cms/contents/${contentId}/publish`);

      const response = await request(app.getHttpServer())
        .post(`/api/cms/contents/${contentId}/archive`)
        .expect(201);

      expect(response.body.status).toBe("archived");
    });
  });

  describe("DELETE /api/cms/contents/:id", () => {
    it("should delete content", async () => {
      // Create content first
      const createResponse = await request(app.getHttpServer())
        .post("/api/cms/contents")
        .send(generateTestContent({ title: "Content To Delete" }));

      const contentId = createResponse.body.id;

      await request(app.getHttpServer()).delete(`/api/cms/contents/${contentId}`).expect(204);

      // Verify it's deleted
      await request(app.getHttpServer()).get(`/api/cms/contents/${contentId}`).expect(404);
    });
  });
});
