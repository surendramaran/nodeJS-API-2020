const unirest = require("unirest")

const f2s = unirest("POST", "https://www.fast2sms.com/dev/bulk")

f2s.headers({
    "content-type": "application/x-www-form-urlencoded",
    "cache-control": "no-cache",
    "authorization": process.env.FAST2SMS_API_KEY
});

module.exports = f2s;