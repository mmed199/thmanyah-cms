/**
 * App E2E Test
 *
 * Basic application startup and health check tests.
 */

import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createTestApp, stopPostgresContainer } from "./utils";

describe("Application (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
    await stopPostgresContainer();
  });

  describe("Health", () => {
    it("GraphQL endpoint should be accessible", async () => {
      const query = `
        query {
          __schema {
            queryType {
              name
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post("/graphql")
        .send({ query })
        .expect(200);

      expect(response.body.data.__schema.queryType.name).toBe("Query");
    });
  });
});
