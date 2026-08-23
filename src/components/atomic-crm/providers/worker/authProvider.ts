/**
 * DaloCRM — bypass auth provider
 *
 * Skips login entirely: checkAuth always resolves, getIdentity
 * returns the first sales record from the API (or a fallback).
 * Replace this with a real Clerk / Auth0 provider later.
 */

import type { AuthProvider } from "ra-core";
import { canAccess } from "../commons/canAccess";

const API_URL = (import.meta.env.VITE_API_URL as string) || "https://dalo-crm-api.dalo-crm.workers.dev";
const API_KEY = (import.meta.env.VITE_API_KEY as string) || "";

// Fetch the first sales record so we have a real name in the header
async function fetchCurrentSale() {
  try {
    const res = await fetch(`${API_URL}/api/sales?limit=1`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data?.[0] ?? null;
  } catch {
    return null;
  }
}

let _saleCache: any = null;

async function getSale() {
  if (_saleCache) return _saleCache;
  _saleCache = await fetchCurrentSale();
  return _saleCache;
}

export const getAuthProvider = (): AuthProvider => ({
  // ------------------------------------------------------------------
  // Always succeed — no real login gate in API-key mode
  // ------------------------------------------------------------------
  login: async () => {
    /* no-op */
  },

  logout: async () => {
    _saleCache = null;
    /* no-op */
  },

  checkAuth: async () => {
    /* always authenticated */
  },

  checkError: async () => {
    /* never treat API errors as auth failures */
  },

  // ------------------------------------------------------------------
  // Identity — shown in the top-right user menu
  // ------------------------------------------------------------------
  getIdentity: async () => {
    const sale = await getSale();

    if (sale) {
      return {
        id: sale.id,
        fullName: `${sale.first_name} ${sale.last_name}`.trim() || sale.email,
        avatar: sale.avatar?.src ?? undefined,
      };
    }

    return { id: "admin", fullName: "Admin" };
  },

  // ------------------------------------------------------------------
  // Permissions — treat everyone as admin for now
  // ------------------------------------------------------------------
  getPermissions: async () => "admin",

  canAccess: async (params) => {
    const sale = await getSale();
    const role = sale?.administrator ? "admin" : "user";
    return canAccess(role, params);
  },
});
