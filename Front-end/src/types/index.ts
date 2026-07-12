export type UserRole = "Fleet Manager" | "Dispatcher" | "Safety Officer" | "Financial Analyst";

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type VehicleType = "Truck" | "Van" | "Bus" | "Car" | "Trailer";

export interface Vehicle {
  id: string;
  registration: string;
  name: string;
  model: string;
  type: VehicleType;
  capacity: number; // kg
  odometer: number; // km
  cost: number;
  status: VehicleStatus;
}

export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type LicenseCategory = "LMV" | "HMV" | "HTV" | "PSV";

export interface Driver {
  id: string;
  name: string;
  license: string;
  category: LicenseCategory;
  expiry: string; // ISO date
  phone: string;
  safetyScore: number;
  status: DriverStatus;
}

export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  distance: number;
  status: TripStatus;
  eta: string;
  finalOdometer?: number;
  fuelUsed?: number;
  notes?: string;
  createdAt: string;
}

export type MaintenanceStatus = "Scheduled" | "In Progress" | "Completed";
export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  date: string;
  status: MaintenanceStatus;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  pricePerLiter: number;
}

export interface Expense {
  id: string;
  tripId?: string;
  vehicleId: string;
  toll: number;
  repair: number;
  misc: number;
  date: string;
}
