"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_STOREFRONT_CONFIG,
  type StorefrontConfig,
} from "@/lib/core-catalog";

const CONFIG_STORAGE_KEY = "knitx_storefront_config_v12";

interface StorefrontConfigContextValue {
  config: StorefrontConfig;
  loading: boolean;
  saving: boolean;
  updateConfig: (
    patch: Partial<StorefrontConfig>,
    adminPasscode?: string
  ) => Promise<{ ok: boolean; persistedToStudio: boolean; error?: string }>;
  resetConfig: (
    adminPasscode?: string
  ) => Promise<{ ok: boolean; persistedToStudio: boolean; error?: string }>;
  refreshConfig: () => Promise<void>;
}

const StorefrontConfigContext = createContext<
  StorefrontConfigContextValue | undefined
>(undefined);

function mergeConfig(
  incoming?: Partial<StorefrontConfig> | null
): StorefrontConfig {
  if (!incoming || typeof incoming !== "object") {
    return DEFAULT_STOREFRONT_CONFIG;
  }
  return {
    ...DEFAULT_STOREFRONT_CONFIG,
    ...incoming,
    gridColumns: incoming.gridColumns === 3 ? 3 : 4,
    coreLaunchOffsetDays:
      typeof incoming.coreLaunchOffsetDays === "number" &&
      Number.isFinite(incoming.coreLaunchOffsetDays)
        ? Math.max(1, Math.min(90, Math.round(incoming.coreLaunchOffsetDays)))
        : DEFAULT_STOREFRONT_CONFIG.coreLaunchOffsetDays,
  };
}

export function StorefrontConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<StorefrontConfig>(
    DEFAULT_STOREFRONT_CONFIG
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "GET",
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          config?: Partial<StorefrontConfig>;
        };
        if (data.config) {
          const merged = mergeConfig(data.config);
          setConfig(merged);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              CONFIG_STORAGE_KEY,
              JSON.stringify(merged)
            );
          }
          return;
        }
      }
    } catch {
      // Fall back to local cache or defaults
    }

    if (typeof window !== "undefined") {
      try {
        const cached = window.localStorage.getItem(CONFIG_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as Partial<StorefrontConfig>;
          setConfig(mergeConfig(parsed));
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (typeof window !== "undefined") {
        try {
          const cached = window.localStorage.getItem(CONFIG_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as Partial<StorefrontConfig>;
            if (active) setConfig(mergeConfig(parsed));
          }
        } catch {
          // Ignore storage read errors
        }
      }
      await refreshConfig();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshConfig]);

  const updateConfig = useCallback(
    async (
      patch: Partial<StorefrontConfig>,
      adminPasscode?: string
    ): Promise<{ ok: boolean; persistedToStudio: boolean; error?: string }> => {
      const next = mergeConfig({ ...config, ...patch });
      setConfig(next);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
      }

      setSaving(true);
      try {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(adminPasscode ? { "x-knitx-admin-code": adminPasscode } : {}),
          },
          body: JSON.stringify({ config: next }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          persistedToStudio?: boolean;
          error?: string;
        };

        if (!res.ok) {
          return {
            ok: false,
            persistedToStudio: false,
            error: data.error || "Unable to save settings.",
          };
        }

        return {
          ok: true,
          persistedToStudio: Boolean(data.persistedToStudio),
        };
      } catch {
        return { ok: true, persistedToStudio: false };
      } finally {
        setSaving(false);
      }
    },
    [config]
  );

  const resetConfig = useCallback(
    async (adminPasscode?: string) => {
      return updateConfig(DEFAULT_STOREFRONT_CONFIG, adminPasscode);
    },
    [updateConfig]
  );

  const value = useMemo<StorefrontConfigContextValue>(
    () => ({
      config,
      loading,
      saving,
      updateConfig,
      resetConfig,
      refreshConfig,
    }),
    [config, loading, saving, updateConfig, resetConfig, refreshConfig]
  );

  return (
    <StorefrontConfigContext.Provider value={value}>
      {children}
    </StorefrontConfigContext.Provider>
  );
}

export function useStorefrontConfig(): StorefrontConfigContextValue {
  const ctx = useContext(StorefrontConfigContext);
  if (!ctx) {
    throw new Error(
      "useStorefrontConfig must be used within a StorefrontConfigProvider"
    );
  }
  return ctx;
}
