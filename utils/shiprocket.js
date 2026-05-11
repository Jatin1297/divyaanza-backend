const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let cachedTokenAtMs = 0;

const getEnv = (key) => (process.env[key] || "").trim();

const getToken = async () => {
  const email = getEnv("SHIPROCKET_EMAIL");
  const password = getEnv("SHIPROCKET_PASSWORD");
  if (!email || !password) {
    throw new Error("Shiprocket is not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
  }

  // Shiprocket tokens usually last days; refresh every 8 hours to be safe.
  const ageMs = Date.now() - cachedTokenAtMs;
  if (cachedToken && ageMs < 8 * 60 * 60 * 1000) return cachedToken;

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Shiprocket login failed");
  }
  if (!data?.token) {
    throw new Error("Shiprocket login did not return token");
  }

  cachedToken = data.token;
  cachedTokenAtMs = Date.now();
  return cachedToken;
};

const shiprocketFetch = async (path, { method = "GET", body } = {}) => {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };
  let finalBody = undefined;

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    finalBody = JSON.stringify(body);
  }

  const res = await fetch(`${SHIPROCKET_BASE}${path}`, {
    method,
    headers,
    body: finalBody,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Shiprocket error (${res.status})`);
  }
  return data;
};

export const shiprocketCreateAdhocOrder = async (payload) =>
  shiprocketFetch("/orders/create/adhoc", { method: "POST", body: payload });

export const shiprocketAssignAwb = async ({ shipment_id, courier_id }) =>
  shiprocketFetch("/courier/assign/awb", {
    method: "POST",
    body: courier_id ? { shipment_id, courier_id } : { shipment_id },
  });

export const shiprocketTrackAwb = async (awbCode) =>
  shiprocketFetch(`/courier/track/awb/${encodeURIComponent(awbCode)}`, { method: "GET" });

