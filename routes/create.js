const express = require('express')
const router = express.Router()
const connection = require('../databases/mysql')
const client = require('../databases/redis')
const jwt = require("jsonwebtoken")

router.post('/create', authenticateCreateToken, (req, res) => {
    if (req.token) { res.cookie("accessToken", req.token, {httpOnly: true, secure: true}) }
    if(req.user){
        const name = req.body.name
        const nameList = name.split("|")
        let pack = {
            pack_name: req.body.packname,
            pack_type: req.body.packtype,
            pack_admin: req.user.userID
        }
        for (i = 1; i < nameList.length+1; i++) {
            pack['member'+i] = nameList[i]
        }
        connection.query('INSERT INTO packs SET ?', pack, (error, rows) => {
            if (error) {
                console.log(error)
            } else {
                res.redirect("/")
            }
        })
    } else{
        context = {user: false}
        res.render("home", context)
    }
})

router.get("/create/getuser/:text", authenticateCreateToken,  (req, res) =>{
    if (req.token) { res.cookie("accessToken", req.token, {httpOnly: true, secure: true}) }
    let text = req.params.text
    const userID = req.user.userID
    if (userID) {
        const q = `SELECT user_id, full_name, profile_pic_small FROM users WHERE full_name REGEXP '${text}' AND user_id != '${userID}' LIMIT 5`
        connection.query(q, (error, rows) => {
            if (error) {
                console.log(error)
            } else {
                let data = []
                rows.forEach(x =>{
                    let obj = {}
                    obj['id'] = x.user_id
                    obj['name'] = x.full_name
                    obj['pic'] = x.profile_pic_small
                    data.push(obj)
                })
                res.send(data)
            }
        })
    } else {
        context = {user: false}
        res.render("home", context)
    }
    
})

function authenticateCreateToken(req, res, next) {
    const token = req.cookies.accessToken
    const refresh = req.cookies.refreshToken
    if (token == null) {
        return res.status(401).redirect("/login")
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