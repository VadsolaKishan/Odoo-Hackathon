import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app";

describe("Auth Feature", () => {
  it("should login with dummy credentials and return a token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "demo1234",
        role: "Fleet Manager"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("test@example.com");
  });

  it("should fail with incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword",
        role: "Fleet Manager"
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
