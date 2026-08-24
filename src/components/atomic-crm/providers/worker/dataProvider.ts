import type { DataProvider } from "ra-core";
import type { ConfigurationContextValue } from "../../root/ConfigurationContext";

const API_URL = (import.meta.env.VITE_API_URL as string) || "https://dalo-crm-api.dalo-crm.workers.dev";
const API_KEY = (import.meta.env.VITE_API_KEY as string) || "";

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function qs(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length ? "?" + parts.join("&") : "";
}

const getList = async (resource: string, params: any) => {
  const { pagination = { page: 1, perPage: 25 }, sort = { field: "id", order: "ASC" }, filter = {} } = params;
  const query: Record<string, unknown> = { page: pagination.page, limit: pagination.perPage, sort: sort.field, order: sort.order, ...filter };
  const result = await apiFetch(`/api/${resource}${qs(query)}`);
  return { data: result.data as any[], total: result.total as number };
};

const getOne = async (resource: string, params: any) => {
  const result = await apiFetch(`/api/${resource}/${params.id}`);
  return { data: result.data };
};

const getMany = async (resource: string, params: any) => {
  const data = await Promise.all(
    (params.ids as (string | number)[]).map((id) => apiFetch(`/api/${resource}/${id}`).then((r) => r.data))
  );
  return { data: data.filter(Boolean) };
};

const getManyReference = async (resource: string, params: any) => {
  const { pagination = { page: 1, perPage: 25 }, sort = { field: "id", order: "ASC" }, filter = {}, target, id } = params;
  const query: Record<string, unknown> = { page: pagination.page, limit: pagination.perPage, sort: sort.field, order: sort.order, [target]: id, ...filter };
  const result = await apiFetch(`/api/${resource}${qs(query)}`);
  return { data: result.data as any[], total: result.total as number };
};

const create = async (resource: string, params: any) => {
  const result = await apiFetch(`/api/${resource}`, { method: "POST", body: JSON.stringify(params.data) });
  return { data: result.data };
};

const update = async (resource: string, params: any) => {
  // Merge previousData with data so a partial update (e.g. status-only) never wipes other fields
  const merged = { ...(params.previousData ?? {}), ...params.data };
  const result = await apiFetch(`/api/${resource}/${params.id}`, { method: "PUT", body: JSON.stringify(merged) });
  return { data: result.data };
};

const updateMany = async (resource: string, params: any) => {
  await Promise.all((params.ids as (string | number)[]).map((id) => apiFetch(`/api/${resource}/${id}`, { method: "PUT", body: JSON.stringify(params.data) })));
  return { data: params.ids };
};

const deleteOne = async (resource: string, params: any) => {
  await apiFetch(`/api/${resource}/${params.id}`, { method: "DELETE" });
  return { data: { id: params.id } };
};

const deleteMany = async (resource: string, params: any) => {
  await Promise.all((params.ids as (string | number)[]).map((id) => apiFetch(`/api/${resource}/${id}`, { method: "DELETE" })));
  return { data: params.ids };
};

const getConfiguration = async (): Promise<ConfigurationContextValue> => {
  const result = await apiFetch("/api/configuration");
  return (result.data?.config as ConfigurationContextValue) ?? {};
};

const updateConfiguration = async (config: ConfigurationContextValue): Promise<ConfigurationContextValue> => {
  const result = await apiFetch("/api/configuration", { method: "PUT", body: JSON.stringify({ config }) });
  return (result.data?.config as ConfigurationContextValue) ?? {};
};

export const getDataProvider = () =>
  ({
    getList, getOne, getMany, getManyReference,
    create, update, updateMany,
    delete: deleteOne, deleteMany,
    getConfiguration,
    updateConfiguration,
    isInitialized: async () => true,
    mergeContacts: async () => { throw new Error("mergeContacts not yet implemented"); },
    signUp: async (data: any) => { const r = await create("sales", { data }); return r.data; },
    salesCreate: async (body: any) => { const r = await create("sales", { data: body }); return r.data; },
    salesUpdate: async (id: any, data: any) => { const r = await update("sales", { id, data, previousData: {} }); return r.data; },
    updatePassword: async () => true,
    unarchiveDeal: async (deal: any) => update("deals", { id: deal.id, data: { ...deal, archived_at: null }, previousData: deal }),
  } satisfies DataProvider & Record<string, unknown>);
