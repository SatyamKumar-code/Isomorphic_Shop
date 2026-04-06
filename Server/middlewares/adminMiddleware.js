import JWT from "jsonwebtoken";

const adminMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req?.headers?.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "provide token",
                error: true,
                success: false
            })
        }

        let decoded;
        try {
            decoded = JWT.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
        } catch (err) {
            // If token expired or invalid, just return 401. Do not refresh here.
            return res.status(401).json({
                message: err.name === "TokenExpiredError" ? "access token expired" : "unauthorized access",
                error: true,
                success: false,
                
            });
            
        }

        if (!decoded) {
            return res.status(401).json({
                message: "unauthorized access",
                error: true,
                success: false
            })
        }

        if (decoded.role !== "admin") {
            return res.status(403).json({
                message: "admin access only",
                error: true,
                success: false
            })
        }

        req.userId = decoded.id;
        next();

    } catch (error) {
        return res.status(500).json({
            message: "You have not login",
            error: true,
            success: false
        })
    }
}
export default adminMiddleware;