const mysql = require("mysql");
const fs = require("fs")

const connection = mysql.createConnection({
    host: process.env.MYSQL_SERVER_HOST,
    user: process.env.MYSQL_SERVER_USER,
    password: process.env.MYSQL_SERVER_PASSWORD,
    database: process.env.MYSQL_SERVER_DATABASE,
    port: 3306,
    ssl: { ca: fs.readFileSync("./certificates/DigiCertGlobalRootCA.crt.pem") }
});

connection.connect((error) => {
    if (error) {
        console.log("mysql error")
        console.log(error)
    }
    else {
        console.log("Mysql Ready")
    }
});

module.exports = connection;