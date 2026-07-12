import { PrismaClient, UserRole, VehicleType, VehicleStatus, DriverCategory, DriverStatus, TripStatus, MaintenanceStatus } from "@prisma/client";
import { hashPassword } from "../src/utils/hash";

const prisma = new PrismaClient();

async function main() {
  // Clear old tables to guarantee clean seeding and avoid index out of bounds
  console.log("Cleaning database...");
  await prisma.expense.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.maintenanceRecord.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});

  // 1. Seed Users
  const users = [
    { email: "fleetmanager@gmail.com", role: UserRole.FLEET_MANAGER, name: "Fleet Manager" },
    { email: "dispatcher@gmail.com", role: UserRole.DISPATCHER, name: "Dispatcher" },
    { email: "safetyofficer@gmail.com", role: UserRole.SAFETY_OFFICER, name: "Safety Officer" },
    { email: "financialanalyst@gmail.com", role: UserRole.FINANCIAL_ANALYST, name: "Financial Analyst" },
    { email: "manager@transitops.io", role: UserRole.FLEET_MANAGER, name: "Darshan Manager" },
    { email: "test@example.com", role: UserRole.FLEET_MANAGER, name: "Test Manager" },
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
    }
  }

  // 2. Seed Singleton Setting
  const settingExists = await prisma.setting.findUnique({ where: { id: "singleton" } });
  if (!settingExists) {
    await prisma.setting.create({
      data: {
        id: "singleton",
        departmentName: "TransitOps India Hub",
        currency: "INR",
        distanceUnit: "km",
      }
    });
    console.log("Seeded settings");
  }

  // 3. Seed Vehicles
  const vehicleData = [
    { registration: "MH-12-PQ-9081", name: "Alpha Truck", model: "Tata LPT 1618", type: VehicleType.TRUCK, capacity: 16000, odometer: 45000, cost: 2800000, status: VehicleStatus.AVAILABLE },
    { registration: "GJ-01-AB-1234", name: "Beta Van", model: "Mahindra Bolero", type: VehicleType.VAN, capacity: 750, odometer: 12000, cost: 850000, status: VehicleStatus.AVAILABLE },
    { registration: "KA-03-CD-5678", name: "City Bus", model: "Tata Starbus", type: VehicleType.BUS, capacity: 4500, odometer: 68000, cost: 3500000, status: VehicleStatus.AVAILABLE },
    { registration: "DL-04-EF-9012", name: "Courier Van", model: "Tata Ace", type: VehicleType.VAN, capacity: 800, odometer: 25000, cost: 650000, status: VehicleStatus.ON_TRIP },
    { registration: "HR-05-GH-3456", name: "Express Trailer", model: "Bharat Benz 4028", type: VehicleType.TRAILER, capacity: 28000, odometer: 89000, cost: 4800000, status: VehicleStatus.AVAILABLE },
    { registration: "MH-02-JK-7890", name: "Support Car", model: "Maruti Dzire", type: VehicleType.CAR, capacity: 400, odometer: 18000, cost: 750000, status: VehicleStatus.AVAILABLE },
    { registration: "GJ-02-LM-1289", name: "Mega Hauler", model: "Ashok Leyland Ecomet", type: VehicleType.TRUCK, capacity: 18000, odometer: 95000, cost: 3200000, status: VehicleStatus.IN_SHOP },
    { registration: "DL-02-NP-4567", name: "Cargo Trailer", model: "Volvo FM 400", type: VehicleType.TRAILER, capacity: 32000, odometer: 110000, cost: 6200000, status: VehicleStatus.RETIRED },
  ];

  const vehicles: any[] = [];
  for (const v of vehicleData) {
    const created = await prisma.vehicle.create({ data: v });
    vehicles.push(created);
  }
  console.log(`Seeded ${vehicles.length} vehicles`);

  // 4. Seed Drivers
  const driverData = [
    { name: "Amit Verma", license: "MH-12-2015-001234", category: DriverCategory.HMV, expiry: new Date("2030-05-15"), phone: "+91 9823456780", safetyScore: 94, status: DriverStatus.AVAILABLE },
    { name: "Priya Sharma", license: "GJ-01-2018-005678", category: DriverCategory.LMV, expiry: new Date("2029-10-20"), phone: "+91 9123456789", safetyScore: 88, status: DriverStatus.AVAILABLE },
    { name: "John Fernandes", license: "KA-03-2012-009012", category: DriverCategory.PSV, expiry: new Date("2028-03-12"), phone: "+91 8023456781", safetyScore: 92, status: DriverStatus.AVAILABLE },
    { name: "Rahul Chauhan", license: "DL-04-2019-003456", category: DriverCategory.HTV, expiry: new Date("2031-11-04"), phone: "+91 9923456782", safetyScore: 78, status: DriverStatus.ON_TRIP },
    { name: "Suresh Pillai", license: "MH-02-2020-008901", category: DriverCategory.HTV, expiry: new Date("2025-06-18"), phone: "+91 9523456783", safetyScore: 82, status: DriverStatus.AVAILABLE },
    { name: "Sneha Patel", license: "GJ-02-2014-002345", category: DriverCategory.LMV, expiry: new Date("2032-01-25"), phone: "+91 9423456784", safetyScore: 96, status: DriverStatus.OFF_DUTY },
    { name: "Vikram Rao", license: "DL-02-2011-006789", category: DriverCategory.HMV, expiry: new Date("2029-08-30"), phone: "+91 9323456785", safetyScore: 65, status: DriverStatus.SUSPENDED },
  ];

  const drivers: any[] = [];
  for (const d of driverData) {
    const created = await prisma.driver.create({ data: d });
    drivers.push(created);
  }
  console.log(`Seeded ${drivers.length} drivers`);

  // Helper selectors
  const avVehicles = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE);
  const avDrivers = drivers.filter(d => d.status === DriverStatus.AVAILABLE);

  // 5. Seed Trips
  const t1Vehicle = vehicles[0];
  const t1Driver = drivers[0];
  const trip1 = await prisma.trip.create({
    data: {
      source: "Mumbai",
      destination: "Pune",
      vehicleId: t1Vehicle.id,
      driverId: t1Driver.id,
      cargoWeight: 8000,
      distance: 150,
      status: TripStatus.COMPLETED,
      eta: new Date(Date.now() - 3600_000 * 24),
      finalOdometer: t1Vehicle.odometer + 150,
      fuelUsed: 45,
      notes: "Smooth transit through Expressway. Cargo delivered on schedule.",
    }
  });

  const t2Vehicle = vehicles.find(v => v.status === VehicleStatus.ON_TRIP) || vehicles[3];
  const t2Driver = drivers.find(d => d.status === DriverStatus.ON_TRIP) || drivers[3];
  await prisma.trip.create({
    data: {
      source: "Delhi",
      destination: "Ahmedabad",
      vehicleId: t2Vehicle.id,
      driverId: t2Driver.id,
      cargoWeight: 600,
      distance: 900,
      status: TripStatus.DISPATCHED,
      eta: new Date(Date.now() + 3600_000 * 18),
    }
  });

  if (avVehicles[1] && avDrivers[1]) {
    await prisma.trip.create({
      data: {
        source: "Gandhinagar Depot",
        destination: "Sanand Warehouse",
        vehicleId: avVehicles[1].id,
        driverId: avDrivers[1].id,
        cargoWeight: 450,
        distance: 58,
        status: TripStatus.DRAFT,
        eta: new Date(Date.now() + 3600_000 * 2),
      }
    });
  }

  await prisma.trip.create({
    data: {
      source: "Bangalore",
      destination: "Chennai",
      vehicleId: vehicles[2].id,
      driverId: drivers[2].id,
      cargoWeight: 3500,
      distance: 350,
      status: TripStatus.CANCELLED,
      notes: "Cancelled due to mechanical issues before dispatch.",
    }
  });

  console.log("Seeded trips");

  // 6. Seed Fuel Logs
  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: t1Vehicle.id, date: new Date(Date.now() - 3600_000 * 48), liters: 45, pricePerLiter: 96.5 },
      { vehicleId: vehicles[1].id, date: new Date(Date.now() - 3600_000 * 72), liters: 25, pricePerLiter: 98.2 },
      { vehicleId: vehicles[3].id, date: new Date(Date.now() - 3600_000 * 24), liters: 50, pricePerLiter: 95.8 },
    ]
  });
  console.log("Seeded fuel logs");

  // 7. Seed Expenses
  await prisma.expense.createMany({
    data: [
      { vehicleId: t1Vehicle.id, tripId: trip1.id, toll: 350, repair: 0, misc: 100, date: new Date(Date.now() - 3600_000 * 24) },
      { vehicleId: vehicles[1].id, toll: 0, repair: 1500, misc: 200, date: new Date(Date.now() - 3600_000 * 72) },
    ]
  });
  console.log("Seeded expense records");

  // 8. Seed Maintenance Records
  const inShopVehicle = vehicles.find(v => v.status === VehicleStatus.IN_SHOP) || vehicles[6];
  await prisma.maintenanceRecord.createMany({
    data: [
      { vehicleId: inShopVehicle.id, serviceType: "Engine Repair", cost: 18000, date: new Date(Date.now() - 3600_000 * 24), status: MaintenanceStatus.IN_PROGRESS },
      { vehicleId: vehicles[0].id, serviceType: "Oil Change", cost: 3500, date: new Date(Date.now() - 3600_000 * 240), status: MaintenanceStatus.COMPLETED },
      { vehicleId: vehicles[2].id, serviceType: "Brake Service", cost: 8500, date: new Date(Date.now() + 3600_000 * 72), status: MaintenanceStatus.SCHEDULED },
    ]
  });
  console.log("Seeded maintenance records");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
