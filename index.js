const express = require('express')
const app = express()
require('dotenv').config()
const cookieParser = require("cookie-parser")

const authRoutes = require('./routes/auth')
const createRoutes = require('./routes/create')
const homeRoutes = require('./routes/home')
const packRoutes = require('./routes/pack')
const fileRoutes = require('./routes/file')
const userRoutes = require('./routes/user')

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(express.static(__dirname + "/public"));

app.use(authRoutes)
app.use(createRoutes)
app.use(homeRoutes)
app.use(packRoutes)
app.use(fileRoutes)
app.use(userRoutes)

app.listen(3000, () => console.log("server ready"))