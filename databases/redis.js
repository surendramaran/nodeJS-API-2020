const redis = require("redis")

const client = redis.createClient(6380, process.env.REDIS_CACHE_HOSTNAME,
    {auth_pass: process.env.REDIS_CACHE_KEY, tls: {servername: process.env.REDIS_CACHE_HOSTNAME}}
);

module.exports = client