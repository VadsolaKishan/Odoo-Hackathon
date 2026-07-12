import { prisma } from "../../db/client";
import { CreateTripInput, CompleteTripInput, QueryTripInput } from "./trips.schema";
import { NotFoundError, ValidationError } from "../../shared/errors";
import { TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";

const mapStatus = (status: string) => status.toUpperCase() as TripStatus;

export class TripsService {
  async list(query: QueryTripInput) {
    return prisma.trip.findMany({
      where: query.status ? { status: mapStatus(query.status) } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundError("Trip not found");
    return trip;
  }

  async create(input: CreateTripInput) {
    // Check if vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new ValidationError("Vehicle is not available for a new trip");
    }

    if (input.cargoWeight > vehicle.capacity) {
      throw new ValidationError(`Cargo weight exceeds vehicle capacity (${vehicle.capacity} kg)`);
    }

    // Check driver
    const driver = await prisma.driver.findUnique({ where: { id: input.driverId } });
    if (!driver) throw new NotFoundError("Driver not found");
    if (driver.status !== DriverStatus.AVAILABLE) {
      throw new ValidationError("Driver is not available");
    }

    return prisma.trip.create({
      data: {
        source: input.source,
        destination: input.destination,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        cargoWeight: input.cargoWeight,
        distance: input.distance,
        status: TripStatus.DRAFT,
      },
    });
  }

  async dispatch(id: string) {
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundError("Trip not found");
    if (trip.status !== TripStatus.DRAFT) throw new ValidationError("Only Draft trips can be dispatched");

    // Update vehicle and driver status in a transaction
    return prisma.$transaction(async (tx) => {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.ON_TRIP } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.ON_TRIP } });
      
      return tx.trip.update({
        where: { id },
        data: { status: TripStatus.DISPATCHED, eta: new Date(Date.now() + trip.distance * 1000 * 60) }, // Mock ETA
      });
    });
  }

  async complete(id: string, input: CompleteTripInput) {
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundError("Trip not found");
    if (trip.status !== TripStatus.DISPATCHED) throw new ValidationError("Only dispatched trips can be completed");

    return prisma.$transaction(async (tx) => {
      // Free vehicle and update odometer
      await tx.vehicle.update({ 
        where: { id: trip.vehicleId }, 
        data: { status: VehicleStatus.AVAILABLE, odometer: { increment: input.finalOdometer - (trip.distance || 0) > 0 ? input.finalOdometer - (trip.distance || 0) : input.finalOdometer } } // very basic
      });
      // Free driver
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } });
      
      return tx.trip.update({
        where: { id },
        data: { 
          status: TripStatus.COMPLETED, 
          finalOdometer: input.finalOdometer, 
          fuelUsed: input.fuelUsed, 
          notes: input.notes 
        },
      });
    });
  }

  async cancel(id: string) {
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundError("Trip not found");
    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      throw new ValidationError("Trip is already completed or cancelled");
    }

    if (trip.status === TripStatus.DISPATCHED) {
      // Free up resources
      await prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
      await prisma.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } });
    }

    return prisma.trip.update({
      where: { id },
      data: { status: TripStatus.CANCELLED },
    });
  }
}
