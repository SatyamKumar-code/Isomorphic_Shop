
import express from "express";
import {
	AddToCartController,
	getCartDetailsController,
	removeFromCartController,
	clearCartController,
	updateCartController,
	getCartItemCountController,
	getCartTotalAmountController
} from "../controller/cart.controller.js";
import userMiddleware from "../middlewares/userMiddleware.js";

const cartRouter = express.Router();


cartRouter.post("/add", userMiddleware, AddToCartController);
cartRouter.get("/details", userMiddleware, getCartDetailsController);
cartRouter.delete("/remove/:productId", userMiddleware, removeFromCartController);
cartRouter.delete("/clear", userMiddleware, clearCartController);
cartRouter.put("/update", userMiddleware, updateCartController);
cartRouter.get("/item-count", userMiddleware, getCartItemCountController);
cartRouter.get("/total-amount", userMiddleware, getCartTotalAmountController);

export default cartRouter;
