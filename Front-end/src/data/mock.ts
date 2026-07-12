import type {
  Driver,
  Expense,
  FuelLog,
  MaintenanceRecord,
  Trip,
  Vehicle,
} from "@/types";

const stateCodes = ["GJ", "MH", "RJ", "DL", "KA", "TN", "UP", "MP", "HR", "PB"];
const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
const rand = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

function makeReg(i: number) {
  const s = pick(stateCodes, i);
  const d1 = String(((i * 7) % 30) + 1).padStart(2, "0");
  const l = letters[i % letters.length] + letters[(i * 3) % letters.length];
  const n = String(((i * 137) % 9000) + 1000);
  return `${s}${d1}${l}${n}`;
}

const vehicleTypes = ["Truck", "Van", "Bus", "Car", "Trailer"] as const;
const statuses = ["Available", "Available", "On Trip", "In Shop", "Available", "Retired"] as const;
const modelsByType: Record<string, string[]> = {
  Truck: ["Tata LPT 1618", "Ashok Leyland Ecomet", "Eicher Pro 3015"],
  Van: ["Mahindra Bolero", "Tata Ace", "Maruti Eeco"],
  Bus: ["Ashok Leyland Viking", "Tata Starbus", "Volvo 9400"],
  Car: ["Maruti Dzire", "Hyundai Aura", "Honda Amaze"],
  Trailer: ["Bharat Benz 4028", "Volvo FM 400", "Scania G460"],
};
const capacityByType: Record<string, number> = {
  Truck: 8000,
  Van: 750,
  Bus: 3500,
  Car: 400,
  Trailer: 25000,
};

export const vehicles: Vehicle[] = Array.from({ length: 25 }, (_, i) => {
  const type = vehicleTypes[i % vehicleTypes.length];
  return {
    id: `V${String(i + 1).padStart(3, "0")}`,
    registration: makeReg(i + 1),
    name: `${type} ${i + 1}`,
    model: pick(modelsByType[type], i),
    type,
    capacity: capacityByType[type] + Math.round(rand(i + 1) * 500),
    odometer: Math.round(rand(i + 2) * 180000) + 5000,
    cost: Math.round((rand(i + 3) * 20 + 8) * 100000),
    status: statuses[i % statuses.length],
  };
});

const driverNames = [
  "Alex Kumar", "John Fernandes", "Priya Sharma", "Rahul Mehta", "Sneha Patel",
  "Amit Verma", "Neha Iyer", "Ravi Chauhan", "Karan Singh", "Meera Nair",
  "Vikram Rao", "Anjali Desai", "Suresh Pillai", "Deepak Joshi", "Kavya Reddy",
  "Rohan Malhotra", "Isha Kapoor", "Manish Gupta", "Pooja Bansal", "Arjun Menon",
  "Divya Krishnan", "Nikhil Shah", "Sanjay Yadav", "Rekha Bhat", "Tarun Aggarwal",
  "Ayesha Khan", "Vivek Trivedi", "Nisha Pathak", "Gaurav Rana", "Simran Kaur",
  "Harish Chandra", "Preeti Saxena", "Naveen Kulkarni", "Lakshmi Menon", "Yash Gill",
  "Ritu Bhalla", "Devendra Rathod", "Aarti Sinha", "Kunal Bose", "Farah Sheikh",
];
const licenseCats = ["LMV", "HMV", "HTV", "PSV"] as const;
const driverStatuses = ["Available", "Available", "On Trip", "Off Duty", "Available", "Suspended"] as const;

export const drivers: Driver[] = driverNames.map((name, i) => {
  const yearOffset = i % 5 === 0 ? -1 : i % 3; // some expired
  const expiryYear = 2026 + yearOffset;
  const expiry = new Date(expiryYear, (i * 3) % 12, ((i * 7) % 27) + 1);
  return {
    id: `D${String(i + 1).padStart(3, "0")}`,
    name,
    license: `${pick(stateCodes, i)}-${String(1990 + i).padStart(4, "0")}-${String((i * 31) % 9999).padStart(4, "0")}`,
    category: licenseCats[i % licenseCats.length],
    expiry: expiry.toISOString().slice(0, 10),
    phone: `+91 9${String(800000000 + i * 12345).slice(0, 9)}`,
    safetyScore: Math.round(60 + rand(i + 10) * 40),
    status: driverStatuses[i % driverStatuses.length],
  };
});

const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Ahmedabad", "Pune", "Jaipur", "Hyderabad", "Surat"];

const tripStatuses = ["Draft", "Dispatched", "Dispatched", "Completed", "Completed", "Cancelled"] as const;
export const trips: Trip[] = Array.from({ length: 18 }, (_, i) => {
  const src = pick(cities, i);
  const dst = pick(cities, i + 3);
  const status = tripStatuses[i % tripStatuses.length];
  return {
    id: `TR${String(1000 + i)}`,
    source: src,
    destination: dst,
    vehicleId: vehicles[i % vehicles.length].id,
    driverId: drivers[i % drivers.length].id,
    cargoWeight: Math.round(rand(i + 20) * 4000) + 200,
    distance: Math.round(rand(i + 30) * 1500) + 100,
    status,
    eta: new Date(Date.now() + (i - 6) * 3600 * 1000 * 6).toISOString(),
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    finalOdometer: status === "Completed" ? Math.round(rand(i + 40) * 200000) + 10000 : undefined,
    fuelUsed: status === "Completed" ? Math.round(rand(i + 50) * 200) + 20 : undefined,
  };
});

const serviceTypes = ["Oil Change", "Tire Rotation", "Brake Service", "Engine Repair", "Battery Replacement", "General Inspection"];
const maintStatuses = ["Scheduled", "In Progress", "Completed"] as const;
export const maintenance: MaintenanceRecord[] = Array.from({ length: 8 }, (_, i) => ({
  id: `M${String(i + 1).padStart(3, "0")}`,
  vehicleId: vehicles[(i * 3) % vehicles.length].id,
  serviceType: pick(serviceTypes, i),
  cost: Math.round(rand(i + 60) * 40000) + 2000,
  date: new Date(Date.now() - i * 86400000 * 3).toISOString().slice(0, 10),
  status: maintStatuses[i % maintStatuses.length],
}));

export const fuelLogs: FuelLog[] = Array.from({ length: 12 }, (_, i) => ({
  id: `F${String(i + 1).padStart(3, "0")}`,
  vehicleId: vehicles[i % vehicles.length].id,
  date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  liters: Math.round(rand(i + 70) * 150) + 20,
  pricePerLiter: 95 + Math.round(rand(i + 80) * 15),
}));

export const expenses: Expense[] = Array.from({ length: 15 }, (_, i) => ({
  id: `E${String(i + 1).padStart(3, "0")}`,
  tripId: trips[i % trips.length].id,
  vehicleId: vehicles[i % vehicles.length].id,
  toll: Math.round(rand(i + 90) * 2000) + 100,
  repair: Math.round(rand(i + 100) * 5000),
  misc: Math.round(rand(i + 110) * 1500),
  date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
}));

export const monthlyRevenue = [
  { month: "Jan", revenue: 420000, cost: 260000 },
  { month: "Feb", revenue: 480000, cost: 290000 },
  { month: "Mar", revenue: 510000, cost: 300000 },
  { month: "Apr", revenue: 495000, cost: 310000 },
  { month: "May", revenue: 560000, cost: 330000 },
  { month: "Jun", revenue: 610000, cost: 350000 },
  { month: "Jul", revenue: 645000, cost: 360000 },
  { month: "Aug", revenue: 680000, cost: 380000 },
  { month: "Sep", revenue: 705000, cost: 390000 },
  { month: "Oct", revenue: 720000, cost: 400000 },
  { month: "Nov", revenue: 760000, cost: 410000 },
  { month: "Dec", revenue: 810000, cost: 430000 },
];
