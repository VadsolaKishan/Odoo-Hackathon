import { prisma } from "../../db/client";
import { CreateMaintenanceInput, UpdateMaintenanceInput } from "./maintenance.schema";
import { NotFoundError } from "../../shared/errors";
import { MaintenanceStatus, VehicleStatus } from "@prisma/client";

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

    const mappedStatus = mapStatus(input.status);

    return prisma.$transaction(async (tx) => {
      const record = await tx.maintenanceRecord.create({
        data: {
          vehicleId: input.vehicleId,
          serviceType: input.serviceType,
          cost: input.cost,
          date: new Date(input.date),
          status: mappedStatus,
        },
      });

      if (mappedStatus === MaintenanceStatus.IN_PROGRESS && vehicle.status !== VehicleStatus.RETIRED) {
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { status: VehicleStatus.IN_SHOP },
        });
      }

      return record;
    });
  }

  async updateStatus(id: string, input: UpdateMaintenanceInput) {
    const record = await prisma.maintenanceRecord.findUnique({ 
      where: { id },
      include: { vehicle: true }
    });
    if (!record) throw new NotFoundError("Maintenance record not found");

    const newStatus = mapStatus(input.status);

    return prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.maintenanceRecord.update({
        where: { id },
        data: {
          status: newStatus,
        },
      });

      if (record.vehicle.status !== VehicleStatus.RETIRED) {
        if (newStatus === MaintenanceStatus.IN_PROGRESS) {
          await tx.vehicle.update({
            where: { id: record.vehicleId },
            data: { status: VehicleStatus.IN_SHOP },
          });
        } else if (newStatus === MaintenanceStatus.COMPLETED) {
          await tx.vehicle.update({
            where: { id: record.vehicleId },
            data: { status: VehicleStatus.AVAILABLE },
          });
        }
      }

      return updatedRecord;
    });
  }
}
