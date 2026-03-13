
import express from "express";
import {
	AddAddressesController,
	getAddressesController,
	deleteAddressController,
	getSingleAddressController,
	editAddressController
} from "../controller/address.controller.js";
import userMiddleware from "../middlewares/userMiddleware.js";

const addressRouter = express.Router();

addressRouter.post("/add", userMiddleware, AddAddressesController);
addressRouter.get("/", userMiddleware, getAddressesController);
addressRouter.get("/:id", userMiddleware, getSingleAddressController);
addressRouter.patch("/:id", userMiddleware, editAddressController);
addressRouter.delete("/:id", userMiddleware, deleteAddressController);

export default addressRouter;
