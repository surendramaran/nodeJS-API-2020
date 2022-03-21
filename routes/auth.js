const express = require('express')
const router = express.Router()
const crypto = require("crypto")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const connection = require('../databases/mysql')
const client = require('../databases/redis')
const f2s = require("../services/fast2sms")

router.post("/signup/verifyphone", (req, res) => {
    console.log(req.body)
    const phone = req.body.phone
    const name = req.body.name
    const otp = parseInt(crypto.randomBytes(6).toString('hex'), 32).toString().slice(4, 10)
    console.log(otp)
    const trimName = name.substring(0, 32);
    connection.query(`SELECT phone FROM users WHERE phone = ${phone}`, (error, rows) =>{
        if (error){
            console.log(1)
            console.log(error)
            res.sendStatus(500)
        } else {
            console.log(2)
            if (rows.length > 0) {
                res.status(400)
                res.send("Phone Already Exists")    
            } else {
                console.log(3)
                f2s.headers({
                    "content-type": "application/x-www-form-urlencoded",
                    "cache-control": "no-cache",
                    "authorization": process.env.FAST2SMS_API_KEY
                });
                console.log(4)
                f2s.query({
                    "sender_id": "SMSIND",
                    "language": "english",
                    "route": "qt",
                    "numbers": `${phone}`,
                    "message": 36131, 
                    "variables": "{#FF#}|{#BB#}",
                    "variables_values": `${trimName}|${otp}`
                });
                console.log(5)
                f2s.end((f2sRes) => {
                    console.log(6)
                    if (f2sRes.error){
                        console.log(7)
                        console.log(f2sRes.error)
                        res.status(400).send("Failed")
                    } else{
                        console.log(8)
                        client.set(`=${phone}`, otp, 'EX', 300);
                        console.log(f2sRes.body);
                        res.status(200).send("Succeed")
                    }
                    console.log(9)
                })
                console.log(10)
            }
        }
    })
})

router.post("/signup", async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    const username = req.body.username
    const fullname = req.body.name
    const password = req.body.password
    const phone = req.body.phone
    const otp = req.body.otp
    const hashedPassword = await bcrypt.hash(password, salt)
    client.get(`=${phone}`, (error, response)=>{
        if(error) {
            console.log(error)
            res.status(400)
        } else{
            if(response !== otp) {
                res.send("Invalid Code")
            } else {
                const q = `INSERT INTO users (username, full_name, user_password, phone) VALUES('${username}', '${fullname}', '${hashedPassword}', ${phone})`
                connection.query(q, (error, rows1) => {
                    if (error) {
                        console.log(error)
                        res.redirect('/')
                    }
                    else {
                        q2 = `SELECT * FROM users WHERE username = '${username}'`
                        connection.query(q2, async function(error, rows2, fields){
                            if (error) {
                                console.log(error)
                                res.redirect('/')
                            }
                            else {
                                const serverPassword = rows2[0].user_password
                                const userID = rows2[0].user_id
                                const checkPassword = await bcrypt.compare(password, serverPassword)
                                if (!checkPassword) {
                                    console.log("something wrong with validPassword")
                                    res.redirect("/")
                                }
                                else {
                                    console.log("password was right")
                                    const accessToken = genarateAccessToken(userID, username, fullname)
                                    const refreshToken = genarateRefreshToken(userID, username, fullname)
                                    res.cookie("accessToken", accessToken, {httpOnly: true, secure: true})
                                    res.cookie("refreshToken", refreshToken, {httpOnly: true, secure: true})
                                    client.SADD(refreshToken, accessToken)
                                    res.redirect("/")
                                }
                            }
                        })
                    }
                })
            }
        }
    })
})

router.post("/login", (req, res)=>{
    const username = req.body.username
    const password = req.body.password
    q = "SELECT * FROM users WHERE username = ?"
    connection.query(q, username, async function(error, rows){
        if (error) {
            console.log(error)
            res.redirect('/')
        }
        else {
            const serverPassword = rows[0].user_password
            const userID = rows[0].user_id
            const username = rows[0].username
            const fullname = rows[0].full_name
            const checkPassword = await bcrypt.compare(password, serverPassword)
            if (!checkPassword) {
                console.log("something wrong with validPassword")
                res.redirect("/")
            }
            else {
                console.log("password was right")
                const accessToken = genarateAccessToken(userID, username, fullname)
                const refreshToken = genarateRefreshToken(userID, username, fullname)
                res.cookie("accessToken", accessToken, {httpOnly: true, secure: true})
                res.cookie("refreshToken", refreshToken, {httpOnly: true, secure: true})
                client.SADD(refreshToken, accessToken)
                res.redirect("/")
            }
        }
    })
})

router.get("/logout", (req, res) =>{
    client.DEL(req.cookies.refreshToken)
    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")
    res.redirect("/")
})

function genarateAccessToken(userID, username, fullname){
    return jwt.sign({userID, username, fullname}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10m'})
}

function genarateRefreshToken(userID, username, fullname){
    return jwt.sign({username, userID, fullname}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '30d'})
}

module.exports = router;