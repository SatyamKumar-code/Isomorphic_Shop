import JWT from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import generateAccessToken from "../utils/generateAccessToken.js";

const userMiddleware = async ( req, res, next ) => {
    try {
        const token = req.cookies.accessToken || req?.headers?.authorization?.split(" ")[1];

        if ( !token ) {
            return res.status(401).json({
                message : "provide token",
                error : true,
                success : false
            })
        }

        let decoded;
        try {
            decoded = JWT.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                // Access token expired — try refreshing using refresh token
                const refreshToken = req.cookies.refreshToken;

                if (!refreshToken) {
                    return res.status(401).json({
                        message: "Access token expired. Please login again.",
                        error: true,
                        success: false
                    });
                }

                try {
                    const refreshDecoded = JWT.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
                    const user = await UserModel.findById(refreshDecoded.id);

                    if (!user || user.refresh_token !== refreshToken) {
                        return res.status(401).json({
                            message: "Invalid refresh token. Please login again.",
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

                    decoded = JWT.verify(newAccessToken, process.env.SECRET_KEY_ACCESS_TOKEN);
                } catch (refreshErr) {
                    return res.status(401).json({
                        message: "Session expired. Please login again.",
                        error: true,
                        success: false
                    });
                }
            } else {
                return res.status(401).json({
                    message: "unauthorized access",
                    error: true,
                    success: false
                });
            }
        }

        if ( !decoded ) {
            return res.status(401).json({
                message : "unauthorized access",
                error : true,
                success : false
            })
        }

        if ( decoded.role !== "user" ) {
            return res.status(403).json({
                message : "user access only",
                error : true,
                success : false
            })
        }

        req.userId = decoded.id;
        next();

    } catch (error) {
        return res.status(500).json({
            message : "You have not login",
            error : true,
            success : false
        })
    }
}

export default userMiddleware;