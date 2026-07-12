import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app";

import { prisma } from "../../db/client";

let token = "";
let vehicleId = "";
let driverId = "";
let tripId = "";

describe("Trips Feature", () => {
  beforeAll(async () => {
    // Clean up test data to avoid unique constraint conflicts
    await prisma.trip.deleteMany({ where: { vehicle: { registration: "TRIPTEST" } } });
    await prisma.vehicle.deleteMany({ where: { registration: "TRIPTEST" } });
    await prisma.driver.deleteMany({ where: { license: "TRIP123" } });

    // Get Fleet Manager token (for setup)
    const fmRes = await request(app).post("/api/auth/login").send({
      email: "fleetmanager@gmail.com",
      password: "demo1234",
      role: "Fleet Manager"
    });
    const fmToken = fmRes.body.data.token;

    // Get Dispatcher token (for testing trip dispatch/lifecycle)
    const dispRes = await request(app).post("/api/auth/login").send({
      email: "dispatcher@gmail.com",
      password: "demo1234",
      role: "Dispatcher"
    });
    token = dispRes.body.data.token;

    // Create a vehicle (using Fleet Manager token)
    const vehRes = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${fmToken}`)
      .send({ registration: "TRIPTEST", name: "T1", model: "T", type: "Truck", capacity: 8000, odometer: 0, cost: 0 });
    vehicleId = vehRes.body.data.id;

    // Create a driver (using Fleet Manager token)
    const drvRes = await request(app)
      .post("/api/drivers")
      .set("Authorization", `Bearer ${fmToken}`)
      .send({ name: "D1", license: "TRIP123", category: "LMV", expiry: "2026-12-31", phone: "555-0101", safetyScore: 100 });
    driverId = drvRes.body.data.id;
  });

  it("should create a draft trip", async () => {
    const res = await request(app)
      .post("/api/trips")
      .set("Authorization", `Bearer ${token}`)
      .send({
        source: "Gandhinagar",
        destination: "Ahmedabad",
        vehicleId,
        driverId,
        cargoWeight: 1000,
        distance: 500
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("DRAFT");
    tripId = res.body.data.id;
  });

  it("should dispatch the trip", async () => {
    const res = await request(app)
      .patch(`/api/trips/${tripId}/dispatch`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("DISPATCHED");
  });

  it("should complete the trip", async () => {
    const res = await request(app)
      .patch(`/api/trips/${tripId}/complete`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        finalOdometer: 500,
        fuelUsed: 50,
        notes: "Completed smoothly"
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("COMPLETED");
  });
});
