import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app";

let token = "";
let driverId = "";

describe("Drivers Feature", () => {
  beforeAll(async () => {
    // Get a token
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "demo1234",
      role: "Fleet Manager"
    });
    token = res.body.data.token;
  });

  it("should create a new driver", async () => {
    const res = await request(app)
      .post("/api/drivers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Driver",
        license: `DL-${Date.now()}`,
        category: "LMV",
        expiry: "2026-12-31",
        phone: "9876543210",
        safetyScore: 90
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Driver");
    driverId = res.body.data.id;
  });

  it("should list drivers", async () => {
    const res = await request(app)
      .get("/api/drivers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
