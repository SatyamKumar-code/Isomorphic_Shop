import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/connectDB.js';
import userRouter from './router/user.route.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
    crossOriginIsolated: false
}));    



app.get("/", (req, res) => {
    res.json({
        message: "Server is running on port " + process.env.PORT
    })
});

app.use("/api/user", userRouter);


connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})