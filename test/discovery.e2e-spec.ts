/**
 * Discovery GraphQL E2E Tests
 *
 * End-to-end tests for the GraphQL Discovery API.
 */

import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp, generateTestProgram, generateTestContent, stopAllContainers } from "./utils";

describe("Discovery GraphQL (e2e)", () => {
  let app: INestApplication;
  let publishedProgramId: string;
  let publishedContentId: string;

  beforeAll(async () => {
    app = await createTestApp();

    // Create and publish a program
    const programResponse = await request(app.getHttpServer())
      .post("/api/cms/programs")
      .send(generateTestProgram({ title: "Published Program for Discovery" }));
    publishedProgramId = programResponse.body.id;

    await request(app.getHttpServer())
      .put(`/api/cms/programs/${publishedProgramId}`)
      .send({ status: "published" });

    // Create and publish content
    const contentResponse = await request(app.getHttpServer())
      .post("/api/cms/contents")
      .send(
        generateTestContent({
          title: "Published Content for Discovery",
          programId: publishedProgramId,
        }),
      );
    publishedContentId = contentResponse.body.id;

    await request(app.getHttpServer()).post(`/api/cms/contents/${publishedContentId}/publish`);
  });

  afterAll(async () => {
    await app?.close();
    await stopAllContainers();
  });

  describe("Query: program", () => {
    it("should get a published program by ID", async () => {
      const query = `
        query GetProgram($id: ID!) {
          program(id: $id) {
            id
            title
            description
            type
            category
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: { id: publishedProgramId },
        })
        .expect(200);

      expect(response.body.data.program).toBeDefined();
      expect(response.body.data.program.id).toBe(publishedProgramId);
      expect(response.body.data.program.status).toBe("PUBLISHED");
    });

    it("should return null for draft program", async () => {
      // Create a draft program
      const programResponse = await request(app.getHttpServer())
        .post("/api/cms/programs")
        .send(generateTestProgram({ title: "Draft Program" }));
      const draftProgramId = programResponse.body.id;

      const query = `
        query GetProgram($id: ID!) {
          program(id: $id) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: { id: draftProgramId },
        })
        .expect(200);

      expect(response.body.data.program).toBeNull();
    });
  });

  describe("Query: programs", () => {
    it("should list published programs", async () => {
      const query = `
        query ListPrograms {
          programs(limit: 10, offset: 0) {
            items {
              id
              title
              status
            }
            total
            limit
            offset
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.programs.items).toBeDefined();
      expect(Array.isArray(response.body.data.programs.items)).toBe(true);
      // All items should be published
      response.body.data.programs.items.forEach((item: any) => {
        expect(item.status).toBe("PUBLISHED");
      });
    });

    it("should filter programs by category", async () => {
      const query = `
        query ListProgramsByCategory($category: Category!) {
          programs(category: $category, limit: 10) {
            items {
              id
              category
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: { category: "TECHNOLOGY" },
        })
        .expect(200);

      response.body.data.programs.items.forEach((item: any) => {
        expect(item.category).toBe("TECHNOLOGY");
      });
    });
  });

  describe("Query: content", () => {
    it("should get published content by ID", async () => {
      const query = `
        query GetContent($id: ID!) {
          content(id: $id) {
            id
            title
            status
            programId
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: { id: publishedContentId },
        })
        .expect(200);

      expect(response.body.data.content).toBeDefined();
      expect(response.body.data.content.id).toBe(publishedContentId);
      expect(response.body.data.content.status).toBe("PUBLISHED");
    });
  });

  describe("Query: contents", () => {
    it("should list published contents", async () => {
      const query = `
        query ListContents {
          contents(limit: 10) {
            items {
              id
              title
              status
            }
            total
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.contents.items).toBeDefined();
      response.body.data.contents.items.forEach((item: any) => {
        expect(item.status).toBe("PUBLISHED");
      });
    });
  });

  describe("Query: search", () => {
    it("should search across programs and contents", async () => {
      const query = `
        query Search($input: SearchInput!) {
          search(input: $input) {
            items {
              score
              program {
                id
                title
              }
              content {
                id
                title
              }
            }
            total
            query
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: {
            input: {
              query: "Discovery",
              limit: 10,
            },
          },
        })
        .expect(200);

      expect(response.body.data.search.items).toBeDefined();
      expect(response.body.data.search.query).toBe("Discovery");
    });

    it("should filter search by category", async () => {
      const query = `
        query SearchByCategory($input: SearchInput!) {
          search(input: $input) {
            items {
              program {
                category
              }
              content {
                category
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: {
            input: {
              categories: ["TECHNOLOGY"],
              limit: 10,
            },
          },
        })
        .expect(200);

      response.body.data.search.items.forEach((item: any) => {
        if (item.program) {
          expect(item.program.category).toBe("TECHNOLOGY");
        }
        if (item.content) {
          expect(item.content.category).toBe("TECHNOLOGY");
        }
      });
    });
  });

  describe("Nested queries", () => {
    it("should resolve program contents", async () => {
      const query = `
        query GetProgramWithContents($id: ID!) {
          program(id: $id) {
            id
            title
            contents(limit: 5) {
              id
              title
            }
            contentCount
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({
          query,
          variables: { id: publishedProgramId },
        })
        .expect(200);

      expect(response.body.data.program.contents).toBeDefined();
      expect(Array.isArray(response.body.data.program.contents)).toBe(true);
      expect(typeof response.body.data.program.contentCount).toBe("number");
    });
  });
});
