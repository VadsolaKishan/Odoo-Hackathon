import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app";

let token = "";
let vehicleId = "";
let maintenanceId = "";

describe("Maintenance Feature", () => {
  beforeAll(async () => {
    // Get a token
    const authRes = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "demo1234",
      role: "Fleet Manager"
    });
    token = authRes.body.data.token;

    // Create a vehicle
    const vehRes = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${token}`)
      .send({ registration: `MAINT-${Date.now()}`, name: "M1", model: "M", type: "Van", capacity: 2000, odometer: 0, cost: 0 });
    vehicleId = vehRes.body.data.id;
  });

  it("should create a maintenance record", async () => {
    const res = await request(app)
      .post("/api/maintenance")
      .set("Authorization", `Bearer ${token}`)
      .send({
        vehicleId,
        serviceType: "Oil Change",
        cost: 1500,
        date: "2026-10-15",
        status: "Scheduled"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.serviceType).toBe("Oil Change");
    maintenanceId = res.body.data.id;
  });

  it("should list maintenance records", async () => {
    const res = await request(app)
      .get("/api/maintenance")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should complete the maintenance", async () => {
    const res = await request(app)
      .put(`/api/maintenance/${maintenanceId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Completed" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("COMPLETED");
  });
});
