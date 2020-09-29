const express = require('express')
const router = express.Router()
const connection = require('../databases/mysql')
const client = require('../databases/redis')
const jwt = require("jsonwebtoken")

router.get('/pack/:ID', authenticatePackToken, (req, res) => {
    if (req.token) { res.cookie("accessToken", req.token, {httpOnly: true, secure: true}) }
    const userID = req.user.userID
	const q1 = `SELECT p.*, u0.full_name n0, u1.full_name n1, u2.full_name n2,
                u3.full_name n3, u4.full_name n4, u5.full_name n5, u6.full_name n6,
                u7.full_name n7, u8.full_name n8, u9.full_name n9
                FROM packs p
                LEFT JOIN users u0 ON p.pack_admin = u0.user_id
                LEFT JOIN users u1 ON p.member1 = u1.user_id
                LEFT JOIN users u2 ON p.member2 = u2.user_id
                LEFT JOIN users u3 ON p.member3 = u3.user_id
                LEFT JOIN users u4 ON p.member4 = u4.user_id
                LEFT JOIN users u5 ON p.member5 = u5.user_id
                LEFT JOIN users u6 ON p.member5 = u6.user_id
                LEFT JOIN users u7 ON p.member5 = u7.user_id
                LEFT JOIN users u8 ON p.member5 = u8.user_id
                LEFT JOIN users u9 ON p.member5 = u9.user_id
                WHERE p.pack_id = ${req.params.ID}`
	connection.query(q1, (error, rows1) => {
		if (error) {
			console.log(error)
			res.sendStatus(404)
		} else {
			if(rows1.length == 0) res.sendStatus(404);
			else {
				let r = rows1[0]
				let isMember = false
				if (userID) {
                    if (r.pack_admin === userID || r.member1 === userID || r.member2 === userID || r.member3 === userID || r.member4 === userID) {
                        isMember = true
                    }
                    if (r.member5 === userID || r.member6 === userID || r.member7 === userID || r.member8 === userID || r.member9 === userID) {
                        isMember = true
                    }
                }
				let isPrivate = true
				if (r.pack_type == 'public') {
					isPrivate = false
				}
				if (isPrivate && !isMember){
					res.sendStatus(403)
				} else {
					let q2 = `SELECT f.*, u.full_name
							FROM files f
							JOIN users u
							ON f.uploaded_by = u.user_id 
							WHERE pack_id = ${req.params.ID}`
					connection.query(q2, (error, rows2) => {
						if (error) {
							console.log(error)
							res.sendStatus(404)
						} else {
							rows2.forEach( (x) => {
								x.uploaded_by = x.full_name
							})
							if (userID) {
								connection.query(`SELECT user_id, username, full_name, profile_pic_small FROM users WHERE user_id = '${userID}'`, (error, rows3) => {
									if (error) {
										console.log(error)
									} else {
										const context = {
											packID: r.pack_id, packName: r.pack_name, packType: r.pack_type,
											packAdmin: r.n0, mem1: r.n1, mem2: r.n2, mem3: r.n3, mem4: r.n4, mem5: r.n5,
                                            mem6: r.n6, mem7: r.n7, mem8: r.n8, mem9: r.n9, isMember, files: rows2, user: rows3[0]
                                        }
										res.render("pack", context)
									}
								})
							} else {
								const context = {
									packID: r.pack_id, packName: r.pack_name, packType: r.pack_type,
									packAdmin: r.n0, mem1: r.n1, mem2: r.n2, mem3: r.n3, mem4: r.n4, mem5: r.n5,
									mem6: r.n6, mem7: r.n7, mem8: r.n8, mem9: r.n9, isMember, files: rows2, user: false
                                }
								res.render("pack", context)
							}
						}
					})
				}
			}
		}
	})
})

router.get('/pack/search/:text', (req, res, next) => {
    let text = req.params.text
    let q = `SELECT pack_id packID, pack_name packName FROM packs WHERE pack_name REGEXP '${text}'
            AND pack_type = 'public' LIMIT 10`
    connection.query(q, (error, rows) => {
        if (error) {
            console.log(error)
        } else {
            res.send(rows)
        }
    })
})

function authenticatePackToken(req, res, next) {
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
								console.log("ss")
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