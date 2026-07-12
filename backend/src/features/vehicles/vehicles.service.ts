import { prisma } from "../../db/client";
import { CreateVehicleInput, QueryVehicleInput, UpdateVehicleInput } from "./vehicles.schema";
import { NotFoundError, ValidationError } from "../../shared/errors";
import { VehicleStatus, VehicleType } from "@prisma/client";

const mapType = (type: string) => type.toUpperCase() as VehicleType;
const mapStatus = (status: string) => status.toUpperCase().replace(" ", "_") as VehicleStatus;

export class VehiclesService {
  async list(query: QueryVehicleInput) {
    return prisma.vehicle.findMany({
      where: {
        AND: [
          query.q
            ? {
                OR: [
                  { registration: { contains: query.q, mode: "insensitive" } },
                  { name: { contains: query.q, mode: "insensitive" } },
                ],
              }
            : {},
          query.type ? { type: mapType(query.type) } : {},
          query.status ? { status: mapStatus(query.status) } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundError("Vehicle not found");
    return vehicle;
  }

  async create(input: CreateVehicleInput) {
    const exists = await prisma.vehicle.findUnique({ where: { registration: input.registration } });
    if (exists) throw new ValidationError("Registration number already exists");

    return prisma.vehicle.create({
      data: {
        registration: input.registration,
        name: input.name,
        model: input.model,
        type: mapType(input.type),
        capacity: input.capacity,
        odometer: input.odometer,
        cost: input.cost,
        status: mapStatus(input.status),
      },
    });
  }

  async update(id: string, input: UpdateVehicleInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundError("Vehicle not found");

    if (input.registration && input.registration !== vehicle.registration) {
      const exists = await prisma.vehicle.findUnique({ where: { registration: input.registration } });
      if (exists) throw new ValidationError("Registration number already exists");
    }

    return prisma.vehicle.update({
      where: { id },
      data: {
        registration: input.registration,
        name: input.name,
        model: input.model,
        type: input.type ? mapType(input.type) : undefined,
        capacity: input.capacity,
        odometer: input.odometer,
        cost: input.cost,
        status: input.status ? mapStatus(input.status) : undefined,
      },
    });
  }
}
