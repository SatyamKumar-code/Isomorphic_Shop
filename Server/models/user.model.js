import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: null
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role : {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    mobile: {
        type: Number,
        default: null,
    },
    otp: {
        type: String,
        default: null
    },
    otp_expiry: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    last_login_date: {
        type: Date,
        default: null
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    refresh_token: {
        type: String,
        default: null
    }
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);

export default UserModel;