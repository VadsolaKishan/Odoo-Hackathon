import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Driver, Expense, FuelLog, MaintenanceRecord, Trip, Vehicle } from "@/types";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "./AuthContext";

interface StoreState {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceRecord[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  settings: { departmentName: string; currency: string; distanceUnit: string } | null;
  currencySymbol: string;
  distanceUnit: string;

  addVehicle: (v: Omit<Vehicle, "id">) => Promise<{ ok: boolean; error?: string }>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<{ ok: boolean; error?: string }>;

  addDriver: (d: Omit<Driver, "id">) => Promise<{ ok: boolean; error?: string }>;
  updateDriver: (id: string, patch: Partial<Driver>) => Promise<{ ok: boolean; error?: string }>;

  createTrip: (
    t: Omit<Trip, "id" | "status" | "createdAt" | "eta"> & { eta?: string },
  ) => Promise<{ ok: boolean; error?: string; id?: string }>;
  dispatchTrip: (id: string) => Promise<{ ok: boolean; error?: string }>;
  completeTrip: (
    id: string,
    data: { finalOdometer: number; fuelUsed: number; notes?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  cancelTrip: (id: string) => Promise<{ ok: boolean; error?: string }>;

  addMaintenance: (m: Omit<MaintenanceRecord, "id">) => Promise<{ ok: boolean; error?: string }>;
  updateMaintenance: (
    id: string,
    patch: Partial<MaintenanceRecord>,
  ) => Promise<{ ok: boolean; error?: string }>;

  addFuelLog: (f: Omit<FuelLog, "id">) => Promise<{ ok: boolean; error?: string }>;
  addExpense: (e: Omit<Expense, "id">) => Promise<{ ok: boolean; error?: string }>;
  updateSettings: (patch: {
    departmentName?: string;
    currency?: string;
    distanceUnit?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<StoreState["settings"]>(null);

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [v, d, t, m, f, e, s] = await Promise.all([
        apiClient<Vehicle[]>("/vehicles"),
        apiClient<Driver[]>("/drivers"),
        apiClient<Trip[]>("/trips"),
        apiClient<MaintenanceRecord[]>("/maintenance"),
        apiClient<FuelLog[]>("/fuel-logs"),
        apiClient<Expense[]>("/expenses"),
        apiClient<StoreState["settings"]>("/settings"),
      ]);
      if (v.success) setVehicles(v.data || []);
      if (d.success) setDrivers(d.data || []);
      if (t.success) setTrips(t.data || []);
      if (m.success) setMaintenance(m.data || []);
      if (f.success) setFuelLogs(f.data || []);
      if (e.success) setExpenses(e.data || []);
      if (s.success) setSettings(s.data || null);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addVehicle = useCallback<StoreState["addVehicle"]>(async (v) => {
    const res = await apiClient<Vehicle>("/vehicles", { method: "POST", body: JSON.stringify(v) });
    if (!res.success) return { ok: false, error: res.error?.message || "Failed to add" };
    setVehicles((prev) => [res.data!, ...prev]);
    return { ok: true };
  }, []);

  const updateVehicle = useCallback<StoreState["updateVehicle"]>(async (id, patch) => {
    const res = await apiClient<Vehicle>(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    if (!res.success) return { ok: false, error: res.error?.message || "Failed to update" };
    setVehicles((prev) => prev.map((v) => (v.id === id ? res.data! : v)));
    return { ok: true };
  }, []);

  const addDriver = useCallback<StoreState["addDriver"]>(async (d) => {
    const res = await apiClient<Driver>("/drivers", { method: "POST", body: JSON.stringify(d) });
    if (!res.success) return { ok: false, error: res.error?.message || "Failed to add" };
    setDrivers((prev) => [res.data!, ...prev]);
    return { ok: true };
  }, []);

  const updateDriver = useCallback<StoreState["updateDriver"]>(async (id, patch) => {
    const res = await apiClient<Driver>(`/drivers/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    if (!res.success) return { ok: false, error: res.error?.message || "Failed to update" };
    setDrivers((prev) => prev.map((d) => (d.id === id ? res.data! : d)));
    return { ok: true };
  }, []);

  const createTrip = useCallback<StoreState["createTrip"]>(async (t) => {
    const res = await apiClient<Trip>("/trips", { method: "POST", body: JSON.stringify(t) });
    if (!res.success) return { ok: false, error: res.error?.message || "Failed to create trip" };
    setTrips((prev) => [res.data!, ...prev]);
    return { ok: true, id: res.data!.id };
  }, []);

  const dispatchTrip = useCallback<StoreState["dispatchTrip"]>(
    async (id) => {
      const res = await apiClient<Trip>(`/trips/${id}/dispatch`, { method: "PATCH" });
      if (!res.success) return { ok: false, error: res.error?.message || "Failed to dispatch" };
      await fetchAll(); // Refetch everything to sync Vehicle/Driver statuses
      return { ok: true };
    },
    [fetchAll],
  );

  const completeTrip = useCallback<StoreState["completeTrip"]>(
    async (id, data) => {
      const res = await apiClient<Trip>(`/trips/${id}/complete`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.success) return { ok: false, error: res.error?.message || "Failed to complete" };
      await fetchAll();
      return { ok: true };
    },
    [fetchAll],
  );

  const cancelTrip = useCallback<StoreState["cancelTrip"]>(
    async (id) => {
      const res = await apiClient<Trip>(`/trips/${id}/cancel`, { method: "PATCH" });
      if (!res.success) return { ok: false, error: res.error?.message || "Failed to cancel" };
      await fetchAll();
      return { ok: true };
    },
    [fetchAll],
  );

  const addMaintenance = useCallback<StoreState["addMaintenance"]>(
    async (m) => {
      const res = await apiClient<MaintenanceRecord>("/maintenance", {
        method: "POST",
        body: JSON.stringify(m),
      });
      if (!res.success)
        return { ok: false, error: res.error?.message || "Failed to add maintenance" };
      await fetchAll();
      return { ok: true };
    },
    [fetchAll],
  );

  const updateMaintenance = useCallback<StoreState["updateMaintenance"]>(
    async (id, patch) => {
      const res = await apiClient<MaintenanceRecord>(`/maintenance/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      if (!res.success) return { ok: false, error: res.error?.message || "Failed to update" };
      await fetchAll();
      return { ok: true };
    },
    [fetchAll],
  );

  const addFuelLog = useCallback<StoreState["addFuelLog"]>(async (f) => {
    const res = await apiClient<FuelLog>("/fuel-logs", { method: "POST", body: JSON.stringify(f) });
    if (!res.success) return { ok: false, error: res.error?.message || "Failed to add fuel log" };
    setFuelLogs((prev) => [res.data!, ...prev]);
    return { ok: true };
  }, []);

  const addExpense = useCallback<StoreState["addExpense"]>(async (e) => {
    const res = await apiClient<Expense>("/expenses", { method: "POST", body: JSON.stringify(e) });
    if (!res.success) return { ok: false, error: res.error?.message || "Failed to add expense" };
    setExpenses((prev) => [res.data!, ...prev]);
    return { ok: true };
  }, []);

  const updateSettings = useCallback<StoreState["updateSettings"]>(async (patch) => {
    const res = await apiClient<StoreState["settings"]>("/settings", {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    if (!res.success)
      return { ok: false, error: res.error?.message || "Failed to update settings" };
    setSettings(res.data || null);
    return { ok: true };
  }, []);

  const currencySymbol = useMemo(() => {
    if (!settings) return "₹";
    const map: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", AED: "د.إ" };
    return map[settings.currency] || "₹";
  }, [settings]);

  const distanceUnit = settings?.distanceUnit || "km";

  const value = useMemo<StoreState>(
    () => ({
      vehicles,
      drivers,
      trips,
      maintenance,
      fuelLogs,
      expenses,
      settings,
      currencySymbol,
      distanceUnit,
      addVehicle,
      updateVehicle,
      addDriver,
      updateDriver,
      createTrip,
      dispatchTrip,
      completeTrip,
      cancelTrip,
      addMaintenance,
      updateMaintenance,
      addFuelLog,
      addExpense,
      updateSettings,
    }),
    [
      vehicles,
      drivers,
      trips,
      maintenance,
      fuelLogs,
      expenses,
      settings,
      currencySymbol,
      distanceUnit,
      addVehicle,
      updateVehicle,
      addDriver,
      updateDriver,
      createTrip,
      dispatchTrip,
      completeTrip,
      cancelTrip,
      addMaintenance,
      updateMaintenance,
      addFuelLog,
      addExpense,
      updateSettings,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
