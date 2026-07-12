import { prisma } from "../../db/client";
import { CreateFuelLogInput } from "./fuelLogs.schema";
import { NotFoundError } from "../../shared/errors";

export class FuelLogsService {
  async list() {
    return prisma.fuelLog.findMany({
      include: {
        vehicle: {
          select: { name: true, registration: true }
        }
      },
      orderBy: { date: "desc" },
    });
  }

  async create(input: CreateFuelLogInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new NotFoundError("Vehicle not found");

    return prisma.fuelLog.create({
      data: {
        vehicleId: input.vehicleId,
        date: new Date(input.date),
        liters: input.liters,
        pricePerLiter: input.pricePerLiter,
      },
    });
  }
}
