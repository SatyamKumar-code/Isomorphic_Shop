import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    products : [
        {
            productId : {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Product",
                required : true
            },
            quantity : {
                type : Number,
                default : 1,
                min: [1, 'Quantity must be at least 1'],
                validate: {
                    validator: Number.isInteger,
                    message: 'Quantity must be an integer.'
                }
            }
        }
    ],
    totalAmount : {
        type : Number,
        required : true,
        default : 0,
        min : [0, 'Total amount cannot be negative']
    },
} , { timestamps : true });

const CartModel = mongoose.model("Cart" , cartSchema);

export default CartModel;