import { Router } from "express";
import { loginUserController, registerUserController, verifyEmailController, refreshTokenController, userAvatarController, logoutController, removeImageFromCloudinary, updateUserDetails, updateUserStatus, forgotPasswordController, verifyForgotPasswordOtpController, resetPasswordController, resetPasswordWithOtpController, getUserController, getCustomersController } from "../controller/user.controller.js";
import upload from "../middlewares/multer.js";
import userMiddleware from "../middlewares/userMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";


const userRouter = Router();

userRouter.post("/register", registerUserController);
userRouter.post("/verify-email", verifyEmailController);
userRouter.post("/login", loginUserController);
userRouter.get("/logout", userMiddleware, logoutController);
userRouter.get("/userData", userMiddleware, getUserController);
userRouter.get("/admin/userData", adminMiddleware, getUserController);
userRouter.get("/admin/customers", adminMiddleware, getCustomersController);
userRouter.post("/refresh-token", refreshTokenController);
userRouter.put("/user-avatar", userMiddleware, upload.array('avatar'), userAvatarController);
userRouter.delete("/deleteImage", userMiddleware, removeImageFromCloudinary);
userRouter.put("/", userMiddleware, updateUserDetails);
userRouter.put("/updateUserStatus/:id", adminMiddleware, updateUserStatus);
userRouter.post("/forgot-password", forgotPasswordController);
userRouter.post("/verify-forgot-password-otp", verifyForgotPasswordOtpController);
userRouter.post("/reset-password-withOtp", resetPasswordWithOtpController);
userRouter.post("/reset-password", userMiddleware, resetPasswordController);



export default userRouter;