// ============================================================
// REDIS.JS — Redis Connection (Optional Caching Layer)
// ============================================================
// Redis is used for caching frequently accessed data like
// assessment results and chat history to reduce DB load.
// If Redis is unavailable, the app continues without caching.
// ============================================================

const { createClient } = require("redis");

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log("⚠️  REDIS_URL not set — running without Redis cache");
      return null;
    }

    redisClient = createClient({ url: redisUrl });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err.message);
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis Connected Successfully");
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn("⚠️  Redis connection failed — running without cache:", error.message);
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
