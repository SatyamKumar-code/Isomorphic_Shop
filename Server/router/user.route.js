import { Router } from "express";
import { loginUserController, registerUserController, verifyEmailController, refreshTokenController, userAvatarController, adminAvatarController, logoutController, removeImageFromCloudinary, updateUserDetails, updateUserStatus, forgotPasswordController, verifyForgotPasswordOtpController, resetPasswordController, resetPasswordWithOtpController, getUserController, getCustomersController, adminSendResetPasswordLinkController, adminForceLogoutUserController, adminUpdateCustomerNoteController, getAdminAccessModeController, adminChangePasswordController } from "../controller/user.controller.js";
import upload from "../middlewares/multer.js";
import userMiddleware from "../middlewares/userMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";


const userRouter = Router();

userRouter.post("/register", registerUserController);
userRouter.post("/verify-email", verifyEmailController);
userRouter.post("/login", loginUserController);
userRouter.get("/logout", userMiddleware, logoutController);
userRouter.get("/admin/logout", adminMiddleware, logoutController);
userRouter.get("/userData", userMiddleware, getUserController);
userRouter.get("/admin/userData", adminMiddleware, getUserController);
userRouter.get("/admin/access-mode", adminMiddleware, getAdminAccessModeController);
userRouter.put("/admin/profile", adminMiddleware, updateUserDetails);
userRouter.put("/admin/change-password", adminMiddleware, adminChangePasswordController);
userRouter.get("/admin/customers", adminMiddleware, getCustomersController);
userRouter.post("/refresh-token", refreshTokenController);
userRouter.put("/user-avatar", userMiddleware, upload.array('avatar'), userAvatarController);
userRouter.put("/admin/user-avatar", adminMiddleware, upload.array('avatar'), adminAvatarController);
userRouter.delete("/deleteImage", userMiddleware, removeImageFromCloudinary);
userRouter.put("/", userMiddleware, updateUserDetails);
userRouter.put("/updateUserStatus/:id", adminMiddleware, updateUserStatus);
userRouter.post("/admin/send-reset-link/:id", adminMiddleware, adminSendResetPasswordLinkController);
userRouter.post("/admin/force-logout/:id", adminMiddleware, adminForceLogoutUserController);
userRouter.put("/admin/customer-note/:id", adminMiddleware, adminUpdateCustomerNoteController);
userRouter.post("/forgot-password", forgotPasswordController);
userRouter.post("/verify-forgot-password-otp", verifyForgotPasswordOtpController);
userRouter.post("/reset-password-withOtp", resetPasswordWithOtpController);
userRouter.post("/reset-password", userMiddleware, resetPasswordController);



export default userRouter;