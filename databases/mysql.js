const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.AZURE_SERVER_HOST,
    user: process.env.AZURE_SERVER_USER,
    password: process.env.AZURE_SERVER_PASSWORD,
    database: process.env.AZURE_SERVER_DATABASE,
    port: 3306,
    ssl: {
        ca: '../certificates/BaltimoreCyberTrustRoot.crt.pem'
    }
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