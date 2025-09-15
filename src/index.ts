import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRoutes from './routes/auth.routes'
import emailRoutes from './routes/email.routes'
import dotenv from 'dotenv';

dotenv.config();

const app = express()
const PORT = process.env.PORT || 3000
app.use(cors())
app.use(express.json())
app.use(cookieParser())

app.get("/", (req, res) => {
    res.send("Hello, World!")
})
app.use('/auth', authRoutes)
app.use('/api/email', emailRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
