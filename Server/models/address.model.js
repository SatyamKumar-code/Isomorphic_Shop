import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    address_line1: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    pincode: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    mobile: {
        type: String,
        default: ""
    },
    selected: {
        type: Boolean,
        default: false
    },
    landmark: {
        type: String,
        default: ""
    },
    addressType: {
        type: String,
        enum: ["Home", "Office"],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, { timestamps: true });

addressSchema.index({ userId: 1, createdAt: -1 });

const AddressModel = mongoose.model("Address", addressSchema);

export default AddressModel;