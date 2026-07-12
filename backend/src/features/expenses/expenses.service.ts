import { prisma } from "../../db/client";
import { CreateExpenseInput } from "./expenses.schema";
import { NotFoundError } from "../../shared/errors";

export class ExpensesService {
  async list() {
    return prisma.expense.findMany({
      include: {
        vehicle: { select: { name: true, registration: true } },
        trip: { select: { source: true, destination: true } }
      },
      orderBy: { date: "desc" },
    });
  }

  async create(input: CreateExpenseInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new NotFoundError("Vehicle not found");

    if (input.tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: input.tripId } });
      if (!trip) throw new NotFoundError("Trip not found");
    }

    return prisma.expense.create({
      data: {
        tripId: input.tripId || null,
        vehicleId: input.vehicleId,
        toll: input.toll,
        repair: input.repair,
        misc: input.misc,
        date: new Date(input.date),
      },
    });
  }
}
