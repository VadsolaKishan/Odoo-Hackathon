import { prisma } from "../../db/client";
import { UpdateSettingsInput } from "./settings.schema";

export class SettingsService {
  async get() {
    let setting = await prisma.setting.findUnique({ where: { id: "singleton" } });
    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          id: "singleton",
          departmentName: "Northern Logistics Dept",
          currency: "INR",
          distanceUnit: "km"
        }
      });
    }
    return setting;
  }

  async update(input: UpdateSettingsInput) {
    return prisma.setting.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        ...input,
      },
      update: {
        ...input,
      }
    });
  }
}
