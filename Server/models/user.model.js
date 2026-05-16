import mongoose from "mongoose";

const refundAccountSchema = new mongoose.Schema({
    accountHolder: {
        type: String,
        default: ""
    },
    accountNumber: {
        type: String,
        default: ""
    },
    ifscCode: {
        type: String,
        default: ""
    },
    bankName: {
        type: String,
        default: ""
    },
    lastUsedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sellerNameKey: {
        type: String,
        default: null,
        select: false,
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
    role: {
        type: String,
        enum: ['user', 'seller', 'admin'],
        default: 'user'
    },
    sellerApprovalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    mobile: {
        type: Number,
        default: null,
    },
    bankName: {
        type: String,
        default: ""
    },
    ifcCode: {
        type: String,
        default: ""
    },
    accountNumber: {
        type: String,
        default: ""
    },
    refundAccounts: {
        type: [refundAccountSchema],
        default: []
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
        enum: ['Active', 'Blocked', 'VIP'],
        default: 'Active'
    },
    support_note: {
        type: String,
        default: ""
    },
    support_note_updated_at: {
        type: Date,
        default: null
    },
    support_note_updated_by: {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        adminName: {
            type: String,
            default: ""
        },
        adminEmail: {
            type: String,
            default: ""
        }
    },
    support_note_history: {
        type: [
            {
                note: {
                    type: String,
                    default: ""
                },
                updatedAt: {
                    type: Date,
                    default: Date.now
                },
                updatedBy: {
                    adminId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                        default: null
                    },
                    adminName: {
                        type: String,
                        default: ""
                    },
                    adminEmail: {
                        type: String,
                        default: ""
                    }
                }
            }
        ],
        default: []
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

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ role: 1, mobile: 1 });
userSchema.index({ name: 1 });
userSchema.index({ mobile: 1 });
userSchema.index(
    { sellerNameKey: 1 },
    {
        unique: true,
        partialFilterExpression: { role: "seller" },
    }
);

const normalizeSellerNameKey = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

userSchema.pre("save", function sellerNameSync() {
    if (this.role === "seller") {
        this.sellerNameKey = normalizeSellerNameKey(this.name);
    } else {
        this.sellerNameKey = null;
    }
});

const UserModel = mongoose.model('User', userSchema);

export default UserModel;