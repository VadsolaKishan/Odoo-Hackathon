import { prisma } from "../../db/client";
import { CreateMaintenanceInput, UpdateMaintenanceInput } from "./maintenance.schema";
import { NotFoundError } from "../../shared/errors";
import { MaintenanceStatus } from "@prisma/client";

const mapStatus = (status: string) => status.toUpperCase().replace(" ", "_") as MaintenanceStatus;

export class MaintenanceService {
  async list() {
    return prisma.maintenanceRecord.findMany({
      include: {
        vehicle: {
          select: { name: true, registration: true }
        }
      },
      orderBy: { date: "desc" },
    });
  }

  async create(input: CreateMaintenanceInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new NotFoundError("Vehicle not found");

    return prisma.maintenanceRecord.create({
      data: {
        vehicleId: input.vehicleId,
        serviceType: input.serviceType,
        cost: input.cost,
        date: new Date(input.date),
        status: mapStatus(input.status),
      },
    });
  }

  async updateStatus(id: string, input: UpdateMaintenanceInput) {
    const record = await prisma.maintenanceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundError("Maintenance record not found");

    return prisma.maintenanceRecord.update({
      where: { id },
      data: {
        status: mapStatus(input.status),
      },
    });
  }
}
