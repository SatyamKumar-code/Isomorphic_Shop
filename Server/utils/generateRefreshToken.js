import UserModel from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateRefreshToken = async ( userId ,role ) => {
    const token = await jwt.sign({ id : userId, role },
        process.env.SECRET_KEY_REFRESH_TOKEN,
        { expiresIn: '7d' }
    );
    
    const updateRefreshTokenUser = await UserModel.updateOne(
        { _id: userId },
        {
            refresh_token: token
        }
    )

    return token;
}

export default generateRefreshToken;