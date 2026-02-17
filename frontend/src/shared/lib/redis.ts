import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

export const redis = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redis.on('error', (err) => console.error('Redis Client Error:', err));

// Auto-connect (singleton pattern like prisma.ts)
if (!redis.isOpen) {
  redis.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
  });
}

// Development hot reload support
if (process.env.NODE_ENV !== 'production') {
  const globalWithRedis = global as typeof globalThis & {
    redis: typeof redis;
  };
  if (!globalWithRedis.redis) {
    globalWithRedis.redis = redis;
  }
}
