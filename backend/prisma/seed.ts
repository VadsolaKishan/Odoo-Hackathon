import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/utils/hash";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: "fleetmanager@gmail.com", role: UserRole.FLEET_MANAGER, name: "Fleet Manager" },
    { email: "dispatcher@gmail.com", role: UserRole.DISPATCHER, name: "Dispatcher" },
    { email: "safetyofficer@gmail.com", role: UserRole.SAFETY_OFFICER, name: "Safety Officer" },
    { email: "financialanalyst@gmail.com", role: UserRole.FINANCIAL_ANALYST, name: "Financial Analyst" },
  ];

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          password: hashPassword("demo1234"),
        }
      });
      console.log(`Created user ${u.email} with role ${u.role}`);
    } else {
      console.log(`User ${u.email} already exists`);
    }
  }

  // Seed vehicles
  const vehicleCount = await prisma.vehicle.count();
  if (vehicleCount === 0) {
    await prisma.vehicle.createMany({
      data: [
        { registration: "MH-01-AB-1234", name: "Alpha Truck", model: "Volvo FH16", type: "TRUCK", capacity: 25000, odometer: 15000, cost: 8500000, status: "Available" },
        { registration: "DL-05-XY-9876", name: "Beta Van", model: "Ford Transit", type: "VAN", capacity: 3500, odometer: 42000, cost: 2100000, status: "Available" },
      ]
    });
    console.log("Seeded vehicles");
  }

  // Seed drivers
  const driverCount = await prisma.driver.count();
  if (driverCount === 0) {
    await prisma.driver.createMany({
      data: [
        { name: "John Doe", licenseNumber: "LIC-12345", expiry: new Date("2028-12-31"), phone: "555-0101", status: "Active" },
        { name: "Jane Smith", licenseNumber: "LIC-98765", expiry: new Date("2029-06-30"), phone: "555-0202", status: "Active" },
      ]
    });
    console.log("Seeded drivers");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
