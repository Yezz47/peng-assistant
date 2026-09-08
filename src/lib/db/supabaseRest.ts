interface SupabaseRequestOptions extends RequestInit {
  prefer?: string;
}

function config(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/u, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY)?.trim();
  return url && key ? { url, key } : null;
}

export function isSupabaseConfigured(): boolean {
  return config() !== null;
}

export async function supabaseRequest<T>(
  path: string,
  { prefer, headers, ...init }: SupabaseRequestOptions = {},
): Promise<T> {
  const current = config();
  if (!current) throw new Error("SUPABASE_NOT_CONFIGURED");
  const response = await fetch(`${current.url}/rest/v1/${path.replace(/^\/+/, "")}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: current.key,
      Authorization: `Bearer ${current.key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
    signal: init.signal ?? AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`SUPABASE_HTTP_${response.status}`);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
