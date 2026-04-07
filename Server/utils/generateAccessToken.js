import jwt from 'jsonwebtoken';

const generateAccessToken = async ( userId ,role ) => {
    const token = await jwt.sign({ id : userId, role },
        process.env.SECRET_KEY_ACCESS_TOKEN,
        { expiresIn: '1h' }
    );
    return token;
}

export default generateAccessToken;