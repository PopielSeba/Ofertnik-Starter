import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let errorData;
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = { message: text };
    }
    
    const error = new Error(`${res.status}: ${text}`);
    (error as any).status = res.status;
    (error as any).statusText = res.statusText;
    Object.assign(error, errorData);
    throw error;
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // For 403 responses, try to parse the JSON to get details
    if (res.status === 403) {
      try {
        const errorData = await res.json();
        const error = new Error(`403: ${errorData.message || 'Forbidden'}`);
        (error as any).status = 403;
        (error as any).statusText = res.statusText;
        Object.assign(error, errorData);
        throw error;
      } catch (parseError) {
        await throwIfResNotOk(res);
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
