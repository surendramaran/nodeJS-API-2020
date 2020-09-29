const express = require('express')
const router = express.Router()
const connection = require('../databases/mysql')
const client = require('../databases/redis')
const jwt = require("jsonwebtoken")
const multer = require("multer")
const upload = multer();
const path = require("path")
const crypto = require("crypto")


router.post('/pack/:ID/new', upload.single('photo'), authenticateFileToken, async (req, res, next) => {
    if (req.token) { res.cookie("accessToken", req.token, {httpOnly: true, secure: true}) }
    const pid = req.params.ID
    const userID = req.user.userID
    const fullname = req.user.fullname
	if (!req.file) {
		console.log("No file received");
		res.sendStatus(400)
    } else {
        const blobName = crypto.randomBytes(32).toString('hex') + path.extname(req.file.originalname)
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		const image = "/uploads/" + req.file.filename
        if (userID){
            const q = `SELECT * FROM packs WHERE pack_id = ${pid} AND
                        (pack_admin = ${userID} OR member1 = ${userID} OR member2 = ${userID} OR member3 = ${userID}
                            OR member4 = ${userID} OR member5 = ${userID} OR member6 = ${userID}
                            OR member7 = ${userID} OR member8 = ${userID} OR member9 = ${userID})`
            connection.query(q, (error, rows1)=>{
                if(error){
                    console.log(error)
                    res.sendStatus(500)
                } else {
                    let isAllowed = false
                    if( rows1.length > 0) { isAllowed = true }
                    if (isAllowed){
                        const uploadBlobResponse = await blockBlobClient.upload(req.file.buffer, req.file.size);
                        const blobAddress = 'https://packnarystorage.blob.core.windows.net/img/' + blobName
                        const q2 = `INSERT INTO files (pack_id, image, uploaded_by) VALUES (${pid}, '${blobAddress}', '${userID}')`
                        connection.query(q2, (error, rows2) => {
                            if (error) {
                                console.log(error)
                                res.sendStatus(400)
                            } else {
                                sentEventsAll(pid, fullname, blobAddress)
                                res.redirect("/pack/" + req.params.ID)
                            }
                        })
                    } else {
                        res.sendStatus(403)
                    }
                }
            })
        } else {
            res.sendStatus(403)
        }
	}
})

router.get('/eventSource/:packID', checkIsPrivate, (req, res, next) => {
    if (req.token) { res.cookie("accessToken", req.token, {httpOnly: true, secure: true}) }
	const userID = req.user.userID
    const pid = req.params.packID
    q = `SELECT * FROM packs WHERE pack_id = ${pid}`
	connection.query(q, (error, rows) => {
		if (error) {
			console.log(error)
			res.sendStatus(400)
		} else {
			if(rows.length == 0) res.sendStatus(404);
			else {
				let r = rows[0]
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
					const headers = {
						'Content-Type': 'text/event-stream',
						'Connection': 'keep-alive',
						'Cache-Control': 'no-cache'
                    }
					res.writeHead(200, headers)
					if( sseClients[pid] === undefined ) {
						sseClients[pid] = []
					}
					sseClients[pid].push(res)
				}
			}
		}
    })
    if( sseClients[pid] === undefined ) {
        sseClients[pid] = []
    }
	req.on('close', () => {
		sseClients[pid].splice(sseClients[pid].indexOf(res), 1)
	});
})

function authenticateFileToken(req, res, next) {
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

function checkIsPrivate(req, res, next) {
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

let sseClients = {}
function sentEventsAll(pid, name, image) {
	const file = {
		pid, name, image
	}
	const data = `data: ${JSON.stringify(file)}\n\n`
	sseClients[pid].forEach(x => {
		x.write(data)
	})
}


module.exports = router;