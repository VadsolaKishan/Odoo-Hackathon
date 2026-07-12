const API_BASE = "http://localhost:4000/api";

export function getToken() {
  const auth = window.localStorage.getItem("transitops.auth");
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
  return null;
}

function transformData(obj: any): any {
  if (Array.isArray(obj)) return obj.map(transformData);
  if (obj && typeof obj === "object") {
    const res: any = {};
    for (const key in obj) {
      if (typeof obj[key] === "string" && (key === "status" || key === "type")) {
        res[key] = obj[key]
          .toLowerCase()
          .split("_")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      } else if (
        typeof obj[key] === "string" &&
        (key === "date" || key === "expiry" || key === "createdAt" || key === "updatedAt")
      ) {
        res[key] = obj[key].split("T")[0];
      } else {
        res[key] = transformData(obj[key]);
      }
    }
    return res;
  }
  return obj;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: any }> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (json.data) {
    json.data = transformData(json.data);
  }
  return json;
}
