import express from 'express';
import UserModel from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import generateAccessToken from '../utils/generateAccessToken.js';
import generateRefreshToken from '../utils/generateRefreshToken.js';
import sendEmailFun from '../config/sendEmail.js';
import VerificationEmail from '../utils/verifyEmailTemplate.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

export const registerUserController = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if ( !name || !email || !password ) {
            return res.status(400).json({
                message: "All fields are required",
                error : true,
                success : false
            })
        }

        const existingUser = await UserModel.findOne({ email });

        if ( existingUser ) {
            return res.status(400).json({
                message: "User already Registered with this email",
                error : true,
                success : false
            })
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sendEmai = await sendEmailFun({
            to: email,
            subject: "Verify email from Classyshop App",
            text: "",
            html: VerificationEmail(name, verifyCode)
        })

        if(!sendEmai) {
            return res.status(500).json({
                message: "Failed to send verification email",
                error : true,
                success : false
            })
        }

        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            otp: verifyCode,
            otp_expiry: Date.now() + 10 * 60 * 1000 // 10 minutes from now
        });

        await newUser.save();

        

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            process.env.SECRET_KEY_ACCESS_TOKEN,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: "User registered successfully! Please verify your email.",
            error: false,
            success: true,
            token
        });


    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success : false
        });
    }
}

export const verifyEmailController = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await UserModel.findOne({ email });

        if ( !user ) {
            return res.status(400).json({
                message: "User not found",
                error : true,
                success : false
            })
        }

        const isCodeValid = user.otp === otp ;
        const isNotExpired = user.otp_expiry > Date.now();

        if( isCodeValid && isNotExpired ) {
            user.emailVerified = true;
            user.otp = null;
            user.otp_expiry = null;
            await user.save();
            return res.status(200).json({
                message: "Email verified successfully",
                error : false,
                success : true
            })
        }else if( !isCodeValid ) {
            return res.status(400).json({
                message: "Invalid OTP",
                error : true,
                success : false
            })
        }else {
            return res.status(400).json({
                message: "OTP Expired",
                error : true,
                success : false
            })
        }

    } catch(error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success : false
        });
    }
}

export const loginUserController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if ( !email || !password ) {
            return res.status(400).json({
                message: "All fields are required",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email });

        if ( !user ) {
            return res.status(400).json({
                message: "user not Registered",
                error : true,
                success : false
            })
        }

        if(user.status !== "Active") {
            return res.status(403).json({
                message: "Contact to Admin, Your Account is Inactive",
                error : true,
                success : false
            })
        }

        if(!user.emailVerified ) {
            return res.status(403).json({
                message: "Please verify your email to login",
                error : true,
                success : false
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if ( !isPasswordValid ) {
            return res.status(400).json({
                message: "Invalid Password",
                error : true,
                success : false
            })
        }

        const accessToken = await generateAccessToken(user._id ,user.role);
        const refreshToken = await generateRefreshToken(user._id ,user.role);

        await UserModel.findByIdAndUpdate(user?._id, {
            last_login_date: Date.now()
        })

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
        res.cookie('accessToken', accessToken, cookiesOptions)
        res.cookie('refreshToken', refreshToken, cookiesOptions)

        return res.status(200).json({
            message: "Login successful",
            error: false,
            success: true,
            data: {
                accessToken,
                refreshToken,
                role: user?.role
            }
        });


    }catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success : false
        });
    }
}

export const getUserController = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserModel.findById({ _id: userId }).select("-password -refresh_token -otp -otp_expiry");

        if ( !user ) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        return res.status(200).json({
            message: "User found",
            error: false,
            success: true,
            data: user
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error" + error.message,
            error: true,
            success: false
        });
    }
}


export async function logoutController(req, res) {
    try {
        const userid = req.userId

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        res.clearCookie("accessToken", cookiesOptions);
        res.clearCookie("refreshToken", cookiesOptions);

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid, {
            refresh_token: ""
        })

        return res.status(200).json({
            message: "Logout successfully",
            error: false,
            success: true
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const refreshTokenController = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req?.headers?.authorization?.split(" ")[1];

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not found",
                error: true,
                success: false
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);

        const user = await UserModel.findById(decoded.id);

        if (!user || user.refresh_token !== refreshToken) {
            return res.status(401).json({
                message: "Invalid refresh token",
                error: true,
                success: false
            });
        }

        const newAccessToken = await generateAccessToken(user._id, user.role);

        const cookiesOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        };
        res.cookie('accessToken', newAccessToken, cookiesOptions);

        return res.status(200).json({
            message: "Access token refreshed successfully",
            error: false,
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired refresh token. Please login again.",
            error: true,
            success: false
        });
    }
}

// image upload
var imagesArr = [];

export async function userAvatarController(req, res) {
    try {
        imagesArr = [];

        const userId = req.userId;
        const image = req.files;

        const user = await UserModel.findById({ _id: userId });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        //first remove image from cloudinary
        const imgUrl = user.avatar;

        if (imgUrl) {
            const urlArr = imgUrl.split("/");
            const avatar_image = urlArr[urlArr.length - 1];
            const imageName = avatar_image.split(".")[0];

            if (imageName) {
                await cloudinary.uploader.destroy(imageName);
            }
        }

        const option = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        for (let i = 0; i < image?.length; i++) {
            const img = await cloudinary.uploader.upload(
                image[i].path,
                option,
                function (error, result) {
                    imagesArr.push(result.secure_url);
                    fs.unlinkSync(`uploads/${req.files[i].filename}`);
                }
            );
        }

        user.avatar = imagesArr[0];
        await user.save();

        return res.status(200).json({
            _id: userId,
            avatar: imagesArr[0],
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function removeImageFromCloudinary(request, response) {
    try {
        const imgUrl = request.query.img;

        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];

        const imageName = image.split(".")[0];

        if (imageName) {
            const res = await cloudinary.uploader.destroy(
                imageName,
                (error, result) => {

                }
            );
            if (res) {
                response.status(200).send(res);
            }
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = verifyCode;
        user.otp_expiry = Date.now() + 10 * 60 * 1000;

        await user.save();

        await sendEmailFun({
            to: email,
            subject: "Password Reset OTP from Classyshop App",
            text: "",
            html: VerificationEmail(user.name, verifyCode)
        })

        return res.status(200).json({
            message: "OTP sent to email successfully",
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const verifyForgotPasswordOtpController = async (req, res) => {
    try {
        const { email, otp} = req.body;
        if( !email || !otp ) {
            return res.status(400).json({
                message: "All fields are required",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        const isCodeValid = user.otp === otp ;
        const isNotExpired = user.otp_expiry > Date.now();
        if( isCodeValid && isNotExpired ) {

            user.otp = null;
            user.otp_expiry = null;
            await user.save();

            return res.status(200).json({
                message: "OTP verified successfully",
                error : false,
                success : true
            })

        }else if( !isCodeValid ) {
            return res.status(400).json({
                message: "Invalid OTP",
                error : true,
                success : false
            })
        }else {
            return res.status(400).json({
                message: "OTP Expired",
                error : true,
                success : false
            })
        }


    }catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const resetPasswordController = async (req, res) => {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        const user = await UserModel.findById({ _id: userId });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        if( !newPassword || !confirmPassword || oldPassword ) {
            return res.status(400).json({
                message: "All fields are required",
                error: true,
                success: false
            })
        }

        const checkPassword = bcrypt.compare(oldPassword, user.password)

        if(!checkPassword) {
            return res.status(400).json({
                message: "Your OldPassword is Worng",
                error: true,
                success: false
            })
        }

        if( newPassword !== confirmPassword ) {
            return res.status(400).json({
                message: "Password and Confirm Password must be same",
                error: true,
                success: false
            })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully",
            error: false,
            success: true
        })


    }catch(error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const resetPasswordWithOtpController = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if(!email || !newPassword || !confirmPassword){
            return res.status(400).jso({
                message: "All field are Required",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({email});

        if(!user) {
            return res.status(400).json({
                message: "user not found",
                error: true,
                success: false
            })
        }

        if(newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "NewPassword and confirmPassword must be same",
                error: true,
                success: false
            })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            message: "password reset successfull!",
            error: false,
            success: true
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const updateUserDetails = async (req, res) => {
    try {
            const userId = req.userId;
            const { name, password, mobile } = req.body;
            
            const user = await UserModel.findById({ _id: userId });
            if(!user) {
                return res.status(404).json({
                    message: "User not found",
                    error: true,
                    success: false
                })
            }

            if(name) {
                user.name = name;
            }

            if(password) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                user.password = hashedPassword;
            }

            if(mobile) {
                user.mobile = mobile;
            }

            await user.save();

            return res.status(200).json({
                message: "User details updated successfully",
                error: false,
                success: true,
                user
            })
    }catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function updateUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedUserStatus = await UserModel.findByIdAndUpdate(
            {
                _id: id,
            },
            {
                status: status
            },
            { new: true }
        )
        return res.status(200).json({
            error: false,
            success: true,
            message: "User status updated",
            user: updatedUserStatus
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}