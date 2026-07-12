import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import * as mock from "@/data/mock";
import type {
  Driver, Expense, FuelLog, MaintenanceRecord, Trip, Vehicle,
} from "@/types";

interface StoreState {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  expenses: Expense[];

  addVehicle: (v: Omit<Vehicle, "id">) => { ok: boolean; error?: string };
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;

  addDriver: (d: Omit<Driver, "id">) => void;
  updateDriver: (id: string, patch: Partial<Driver>) => void;

  createTrip: (t: Omit<Trip, "id" | "status" | "createdAt" | "eta"> & { eta?: string }) => { ok: boolean; error?: string; id?: string };
  dispatchTrip: (id: string) => { ok: boolean; error?: string };
  completeTrip: (id: string, data: { finalOdometer: number; fuelUsed: number; notes?: string }) => void;
  cancelTrip: (id: string) => void;

  addMaintenance: (m: Omit<MaintenanceRecord, "id">) => void;
  updateMaintenance: (id: string, patch: Partial<MaintenanceRecord>) => void;

  addFuelLog: (f: Omit<FuelLog, "id">) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mock.vehicles);
  const [drivers, setDrivers] = useState<Driver[]>(mock.drivers);
  const [trips, setTrips] = useState<Trip[]>(mock.trips);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(mock.maintenance);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(mock.fuelLogs);
  const [expenses, setExpenses] = useState<Expense[]>(mock.expenses);

  const nextId = (prefix: string, list: { id: string }[]) =>
    `${prefix}${String(list.length + 1).padStart(3, "0")}`;

  const addVehicle = useCallback<StoreState["addVehicle"]>((v) => {
    if (vehicles.some((x) => x.registration.toLowerCase() === v.registration.toLowerCase())) {
      return { ok: false, error: "Registration number must be unique" };
    }
    setVehicles((prev) => [...prev, { ...v, id: nextId("V", prev) }]);
    return { ok: true };
  }, [vehicles]);

  const updateVehicle: StoreState["updateVehicle"] = (id, patch) =>
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const addDriver: StoreState["addDriver"] = (d) =>
    setDrivers((prev) => [...prev, { ...d, id: nextId("D", prev) }]);
  const updateDriver: StoreState["updateDriver"] = (id, patch) =>
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const createTrip: StoreState["createTrip"] = (t) => {
    const v = vehicles.find((x) => x.id === t.vehicleId);
    const d = drivers.find((x) => x.id === t.driverId);
    if (!v) return { ok: false, error: "Vehicle not found" };
    if (!d) return { ok: false, error: "Driver not found" };
    if (v.status !== "Available") return { ok: false, error: `Vehicle is ${v.status}` };
    if (d.status === "Suspended") return { ok: false, error: "Driver is suspended" };
    if (new Date(d.expiry) < new Date()) return { ok: false, error: "Driver license expired" };
    if (t.cargoWeight > v.capacity)
      return { ok: false, error: `Cargo exceeds capacity by ${t.cargoWeight - v.capacity}kg` };
    const id = `TR${1000 + trips.length + 1}`;
    const eta = t.eta ?? new Date(Date.now() + Math.max(1, t.distance) * 60_000).toISOString();
    setTrips((prev) => [
      { ...t, eta, id, status: "Draft", createdAt: new Date().toISOString() },
      ...prev,
    ]);
    return { ok: true, id };
  };

  const dispatchTrip: StoreState["dispatchTrip"] = (id) => {
    const trip = trips.find((t) => t.id === id);
    if (!trip) return { ok: false, error: "Trip not found" };
    const v = vehicles.find((x) => x.id === trip.vehicleId);
    const d = drivers.find((x) => x.id === trip.driverId);
    if (!v || v.status !== "Available") return { ok: false, error: "Vehicle unavailable" };
    if (!d || d.status === "Suspended") return { ok: false, error: "Driver unavailable" };
    if (new Date(d.expiry) < new Date()) return { ok: false, error: "Driver license expired" };
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Dispatched" } : t)));
    updateVehicle(v.id, { status: "On Trip" });
    updateDriver(d.id, { status: "On Trip" });
    return { ok: true };
  };

  const completeTrip: StoreState["completeTrip"] = (id, data) => {
    const trip = trips.find((t) => t.id === id);
    if (!trip) return;
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Completed", ...data } : t))
    );
    updateVehicle(trip.vehicleId, { status: "Available", odometer: data.finalOdometer });
    updateDriver(trip.driverId, { status: "Available" });
  };

  const cancelTrip: StoreState["cancelTrip"] = (id) => {
    const trip = trips.find((t) => t.id === id);
    if (!trip) return;
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Cancelled" } : t)));
    if (trip.status === "Dispatched") {
      updateVehicle(trip.vehicleId, { status: "Available" });
      updateDriver(trip.driverId, { status: "Available" });
    }
  };

  const addMaintenance: StoreState["addMaintenance"] = (m) => {
    setMaintenance((prev) => [{ ...m, id: nextId("M", prev) }, ...prev]);
    if (m.status === "In Progress" || m.status === "Scheduled") {
      updateVehicle(m.vehicleId, { status: "In Shop" });
    }
  };

  const updateMaintenance: StoreState["updateMaintenance"] = (id, patch) => {
    setMaintenance((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    const rec = maintenance.find((m) => m.id === id);
    if (rec && patch.status === "Completed") {
      const v = vehicles.find((x) => x.id === rec.vehicleId);
      if (v && v.status !== "Retired") updateVehicle(rec.vehicleId, { status: "Available" });
    }
    if (rec && (patch.status === "In Progress" || patch.status === "Scheduled")) {
      updateVehicle(rec.vehicleId, { status: "In Shop" });
    }
  };

  const addFuelLog: StoreState["addFuelLog"] = (f) =>
    setFuelLogs((prev) => [{ ...f, id: nextId("F", prev) }, ...prev]);
  const addExpense: StoreState["addExpense"] = (e) =>
    setExpenses((prev) => [{ ...e, id: nextId("E", prev) }, ...prev]);

  const value = useMemo<StoreState>(
    () => ({
      vehicles, drivers, trips, maintenance, fuelLogs, expenses,
      addVehicle, updateVehicle, addDriver, updateDriver,
      createTrip, dispatchTrip, completeTrip, cancelTrip,
      addMaintenance, updateMaintenance, addFuelLog, addExpense,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vehicles, drivers, trips, maintenance, fuelLogs, expenses]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
