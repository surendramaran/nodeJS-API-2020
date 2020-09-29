const express = require('express')
const router = express.Router()
const connection = require('../databases/mysql')
const client = require('../databases/redis')
const jwt = require("jsonwebtoken")

router.get("/user/:username", authenticateUserToken, (req, res, next) => {
    if (req.token) { res.cookie("accessToken", req.token, {httpOnly: true, secure: true}) }
    const username = req.user.username
    const paramUsername = req.params.username
    if (username == paramUsername){
        const q = `SELECT user_id, username, full_name, profile_pic_small, profile_pic_mid FROM users WHERE username = '${username}'`
        connection.query(q, (error, rows) => {
            if (error) {
                console.log(error)
            } else {
                context = {user: rows[0]}
                res.render("user", context)
            }
        })
    } else{
        res.status(403).redirect("/")
    }
})

router.get("/userPack", authenticateUserToken, (req, res, next) => {
    if (req.token) { res.cookie("accessToken", req.token, {httpOnly: true, secure: true}) }
    const userID = req.user.userID
    const q = `SELECT pack_id packID, pack_name packName, u0.full_name u0
                FROM packs p
                LEFT JOIN users u0 ON p.pack_admin = u0.user_id
                LEFT JOIN users u1 ON p.member1 = u1.user_id
                LEFT JOIN users u2 ON p.member2 = u2.user_id
                LEFT JOIN users u3 ON p.member3 = u3.user_id
                LEFT JOIN users u4 ON p.member4 = u4.user_id
                LEFT JOIN users u5 ON p.member5 = u5.user_id
                LEFT JOIN users u6 ON p.member2 = u6.user_id
                LEFT JOIN users u7 ON p.member3 = u7.user_id
                LEFT JOIN users u8 ON p.member4 = u8.user_id
                LEFT JOIN users u9 ON p.member5 = u9.user_id
                WHERE pack_admin = '${userID}' OR member1 = '${userID}' 
                OR member2 = '${userID}' OR member3 = '${userID}' 
                OR member4 = '${userID}' OR member5 = '${userID}'
                OR member6 = '${userID}' OR member7 = '${userID}' 
                OR member8 = '${userID}' OR member9 = '${userID}'`
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

router.get("/userprofile", authenticateUserToken, (req, res) =>{
    if (req.token) { res.cookie("accessToken", req.token, {httpOnly: true, secure: true}) }
    const userID = req.user.userID
    const q = `SELECT username, full_name fullname, profile_pic_full pp, phone num, gender, dob, created_at accountDate
                FROM users WHERE user_id = ${userID}`
    connection.query(q, (error, rows)=>{
        if(error){
            console.log(error)
            res.status(500)
        } else{
            const stringDate = rows[0].accountDate.toString().split(" ")
            rows[0].accountDate = stringDate[1] + " " + stringDate[3]
            res.send(rows[0])
        }
    })
})

router.get('*', (req, res) => {
    res.sendStatus(404)
})

function authenticateUserToken(req, res, next) {
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