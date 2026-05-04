import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import connectDB from './config/connectDB.js';
import userRouter from './router/user.route.js';
import categoryRouter from './router/category.route.js';
import productRouter from './router/product.route.js';
import cartRouter from './router/cart.route.js';
import addressRouter from './router/address.route.js';
import orderRouter from './router/order.route.js';
import reviewRouter from './router/review.route.js';
import payoutRouter from './router/payout.route.js';
import dashboardRouter from './router/dashboard.route.js';
dotenv.config();

const app = express();
app.use(cors({
    origin: 'http://localhost:5173', // Frontend origin
    credentials: true
}));
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
app.use("/api/category", categoryRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/review", reviewRouter);
app.use("/api/payout", payoutRouter);
app.use("/api/dashboard", dashboardRouter);


connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})