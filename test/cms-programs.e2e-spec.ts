/**
 * CMS Programs E2E Tests
 *
 * End-to-end tests for the Programs REST API.
 */

import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp, generateTestProgram, stopAllContainers } from "./utils";

describe("CMS Programs (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
    await stopAllContainers();
  });

  describe("POST /api/cms/programs", () => {
    it("should create a program", async () => {
      const program = generateTestProgram();

      const response = await request(app.getHttpServer())
        .post("/api/cms/programs")
        .send(program)
        .expect(201);

      expect(response.body).toMatchObject({
        title: program.title,
        description: program.description,
        type: program.type,
        category: program.category,
        language: program.language,
        status: "draft",
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it("should reject invalid program type", async () => {
      const program = generateTestProgram({ type: "invalid_type" });

      await request(app.getHttpServer()).post("/api/cms/programs").send(program).expect(400);
    });

    it("should reject missing required fields", async () => {
      await request(app.getHttpServer())
        .post("/api/cms/programs")
        .send({ title: "Only Title" })
        .expect(400);
    });
  });

  describe("GET /api/cms/programs", () => {
    it("should list programs", async () => {
      // Create a program first
      const program = generateTestProgram({ title: "List Test Program" });
      await request(app.getHttpServer()).post("/api/cms/programs").send(program);

      const response = await request(app.getHttpServer()).get("/api/cms/programs").expect(200);

      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(1);
    });

    it("should filter by category", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/cms/programs")
        .query({ category: "technology" })
        .expect(200);

      expect(response.body.items).toBeDefined();
      response.body.items.forEach((item: any) => {
        expect(item.category).toBe("technology");
      });
    });

    it("should paginate results", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/cms/programs")
        .query({ limit: 5, page: 1 })
        .expect(200);

      expect(response.body.limit).toBe(5);
      expect(response.body.offset).toBe(0);
    });
  });

  describe("GET /api/cms/programs/:id", () => {
    it("should get a program by ID", async () => {
      // Create a program first
      const createResponse = await request(app.getHttpServer())
        .post("/api/cms/programs")
        .send(generateTestProgram({ title: "Get By ID Test" }));

      const programId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/api/cms/programs/${programId}`)
        .expect(200);

      expect(response.body.id).toBe(programId);
      expect(response.body.title).toBe("Get By ID Test");
    });

    it("should return 404 for non-existent program", async () => {
      await request(app.getHttpServer())
        .get("/api/cms/programs/00000000-0000-0000-0000-000000000000")
        .expect(404);
    });

    it("should return 400 for invalid UUID", async () => {
      await request(app.getHttpServer()).get("/api/cms/programs/invalid-uuid").expect(400);
    });
  });

  describe("PUT /api/cms/programs/:id", () => {
    it("should update a program", async () => {
      // Create a program first
      const createResponse = await request(app.getHttpServer())
        .post("/api/cms/programs")
        .send(generateTestProgram({ title: "Original Title" }));

      const programId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .put(`/api/cms/programs/${programId}`)
        .send({ title: "Updated Title" })
        .expect(200);

      expect(response.body.title).toBe("Updated Title");
    });

    it("should publish a draft program", async () => {
      // Create a program first
      const createResponse = await request(app.getHttpServer())
        .post("/api/cms/programs")
        .send(generateTestProgram());

      const programId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .put(`/api/cms/programs/${programId}`)
        .send({ status: "published" })
        .expect(200);

      expect(response.body.status).toBe("published");
    });

    it("should reject invalid status transition", async () => {
      // Create and archive a program
      const createResponse = await request(app.getHttpServer())
        .post("/api/cms/programs")
        .send(generateTestProgram());

      const programId = createResponse.body.id;

      // Publish first
      await request(app.getHttpServer())
        .put(`/api/cms/programs/${programId}`)
        .send({ status: "published" });

      // Archive
      await request(app.getHttpServer())
        .put(`/api/cms/programs/${programId}`)
        .send({ status: "archived" });

      // Try to publish archived program (invalid)
      await request(app.getHttpServer())
        .put(`/api/cms/programs/${programId}`)
        .send({ status: "published" })
        .expect(400);
    });
  });

  describe("DELETE /api/cms/programs/:id", () => {
    it("should delete a program", async () => {
      // Create a program first
      const createResponse = await request(app.getHttpServer())
        .post("/api/cms/programs")
        .send(generateTestProgram({ title: "To Delete" }));

      const programId = createResponse.body.id;

      await request(app.getHttpServer()).delete(`/api/cms/programs/${programId}`).expect(204);

      // Verify it's deleted
      await request(app.getHttpServer()).get(`/api/cms/programs/${programId}`).expect(404);
    });
  });
});
