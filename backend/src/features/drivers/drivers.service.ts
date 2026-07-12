import { prisma } from "../../db/client";
import { CreateDriverInput, QueryDriverInput, UpdateDriverInput } from "./drivers.schema";
import { NotFoundError, ValidationError } from "../../shared/errors";
import { DriverStatus, DriverCategory } from "@prisma/client";

const mapCategory = (category: string) => category.toUpperCase() as DriverCategory;
const mapStatus = (status: string) => status.toUpperCase().replace(" ", "_") as DriverStatus;

export class DriversService {
  async list(query: QueryDriverInput) {
    return prisma.driver.findMany({
      where: {
        AND: [
          query.q
            ? {
                OR: [
                  { name: { contains: query.q, mode: "insensitive" } },
                  { license: { contains: query.q, mode: "insensitive" } },
                ],
              }
            : {},
          query.status ? { status: mapStatus(query.status) } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundError("Driver not found");
    return driver;
  }

  async create(input: CreateDriverInput) {
    const exists = await prisma.driver.findUnique({ where: { license: input.license } });
    if (exists) throw new ValidationError("License number already exists");

    return prisma.driver.create({
      data: {
        name: input.name,
        license: input.license,
        category: mapCategory(input.category),
        expiry: new Date(input.expiry),
        phone: input.phone,
        safetyScore: input.safetyScore,
        status: mapStatus(input.status),
      },
    });
  }

  async update(id: string, input: UpdateDriverInput) {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundError("Driver not found");

    if (input.license && input.license !== driver.license) {
      const exists = await prisma.driver.findUnique({ where: { license: input.license } });
      if (exists) throw new ValidationError("License number already exists");
    }

    return prisma.driver.update({
      where: { id },
      data: {
        name: input.name,
        license: input.license,
        category: input.category ? mapCategory(input.category) : undefined,
        expiry: input.expiry ? new Date(input.expiry) : undefined,
        phone: input.phone,
        safetyScore: input.safetyScore,
        status: input.status ? mapStatus(input.status) : undefined,
      },
    });
  }
}
