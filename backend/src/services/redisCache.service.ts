/*
  Redis-style cache adapter.
  This project environment can run without an external Redis daemon,
  so this service provides an in-memory fallback with TTL semantics.
*/

export type LiveLocationCachePayload = {
  vehicleId: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  time: string;
  angle?: number;
  source?: "live" | "simulation";
  vehicleNumber?: string;
};

type CacheEntry = {
  value: string;
  expiresAt: number;
};

class RedisCacheService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly history = new Map<string, LiveLocationCachePayload[]>();

  private latestKey(vehicleId: string): string {
    return `vehicle:live:${vehicleId}`;
  }

  async upsertLiveLocation(payload: LiveLocationCachePayload): Promise<void> {
    const now = Date.now();
    const ttlMs = 2 * 60 * 1000;
    const key = this.latestKey(payload.vehicleId);

    this.cache.set(key, {
      value: JSON.stringify(payload),
      expiresAt: now + ttlMs,
    });

    const list = this.history.get(payload.vehicleId) || [];
    list.unshift(payload);
    this.history.set(payload.vehicleId, list.slice(0, 5000));
  }

  async getLiveLocation(vehicleId: string): Promise<LiveLocationCachePayload | null> {
    const key = this.latestKey(vehicleId);
    const item = this.cache.get(key);

    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    try {
      return JSON.parse(item.value) as LiveLocationCachePayload;
    } catch {
      return null;
    }
  }
}

export const redisCacheService = new RedisCacheService();
