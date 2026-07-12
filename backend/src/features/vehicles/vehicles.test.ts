import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app";

import { prisma } from "../../db/client";

let token = "";
let vehicleId = "";

describe("Vehicles Feature", () => {
  beforeAll(async () => {
    // Clean up GJ01AB1234 to avoid unique constraint conflicts
    await prisma.vehicle.deleteMany({ where: { registration: "GJ01AB1234" } });

    // Get a token
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "demo1234",
      role: "Fleet Manager"
    });
    token = res.body.data.token;
  });

  it("should create a new vehicle", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${token}`)
      .send({
        registration: "GJ01AB1234",
        name: "Test Truck",
        model: "Tata LPT 1618",
        type: "Truck",
        capacity: 8000,
        odometer: 15000,
        cost: 2500000
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.registration).toBe("GJ01AB1234");
    vehicleId = res.body.data.id;
  });

  it("should list vehicles", async () => {
    const res = await request(app)
      .get("/api/vehicles")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should update a vehicle", async () => {
    const res = await request(app)
      .put(`/api/vehicles/${vehicleId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "In Shop"
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("IN_SHOP"); // Prisma enum format mapped
  });
});
