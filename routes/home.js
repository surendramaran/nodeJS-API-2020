const express = require('express')
const router = express.Router()
const connection = require('../databases/mysql')
const client = require('../databases/redis')
const jwt = require("jsonwebtoken")

router.get("/", authenticateHomeToken, (req, res, next) => {
    if (req.token) { res.cookie("accessToken", req.token, {httpOnly: true, secure: true}) }
    const userID = req.user.userID
    if (userID) {
        connection.query(`SELECT * FROM users WHERE user_id = '${userID}'`, (error, rows) => {
            if (error) {
                console.log(error)
            } else {
                context = {user: rows[0]}
                res.render("home", context)
            }
        })
    } else {
        context = {user: false}
        res.render("home", context)
    }
})

router.get("/explore", (req, res) => {
    const q = `SELECT pack_id packID, pack_name packName, u0.full_name u0
                FROM packs p
                LEFT JOIN users u0 ON p.pack_admin = u0.user_id
                WHERE pack_type = 'public'`
    connection.query(q, (error, rows) => {
        if (error) {
            console.log(error)
            res.send("No Data Found!!")
        }
        else {
            res.send(rows)
        }
    })
})

function authenticateHomeToken(req, res, next) {
    const token = req.cookies.accessToken
    const refresh = req.cookies.refreshToken
    if (token == null) {
        req.user = false
        next()
    } else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                if(err.name == 'TokenExpiredError'){
                    client.SISMEMBER(refresh, token, (error, response) =>{
                        if (error){
                            res.status(403)
                            req.user = false
                            next()
                        } else {
                            if(response == 0){
                                res.clearCookie("accessToken")
					            res.clearCookie("refreshToken")
                                res.status(403)
                                req.user = false
                                next()
                            } else {
                                const d = jwt.decode(token)
                                const newToken = genarateAccessToken(d.userID, d.username, d.fullname)
                                client.SADD(refresh, newToken)
                                client.SREM(refresh, token)
                                req.user = jwt.decode(newToken)
                                req.token = newToken
                                next()
                            }
                        }
                    })
                } else {
                    res.clearCookie("accessToken")
					res.clearCookie("refreshToken")
                    res.status(403)
                    req.user = false
                    next()
                }
            } else {
                req.user = user
                next()
            }
        })
    }
}

function genarateAccessToken(userID, username, fullname){
    return jwt.sign({userID, username, fullname}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10m'})
}

module.exports = router;