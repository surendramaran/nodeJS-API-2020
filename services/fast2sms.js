const unirest = require("unirest")

const f2s = unirest("POST", "https://www.fast2sms.com/dev/bulk")

module.exports = f2s;