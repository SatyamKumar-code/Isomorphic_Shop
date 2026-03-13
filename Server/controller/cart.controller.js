import express from "express";
import CartModel from "../models/cart.model.js";

export const AddToCartController = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId, quantity } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }

        if (!productId || !quantity) {
            return res.status(400).json({
                message: "Product ID and quantity are required",
                error: true,
                success: false
            });
        }

        // Validate quantity
        const parsedQuantity = Number(quantity);
        if (
            isNaN(parsedQuantity) ||
            !Number.isInteger(parsedQuantity) ||
            parsedQuantity < 1
        ) {
            return res.status(400).json({
                message: "Quantity must be a positive integer.",
                error: true,
                success: false
            });
        }

        const eixistingCart = await CartModel.findOne({ userId });

        if (eixistingCart) {
            const productIndex = eixistingCart.products.findIndex(
                (product) => product.productId.toString() === productId
            );
            if (productIndex > -1) {
                eixistingCart.products[productIndex].quantity += quantity;
            } else {
                eixistingCart.products.push({ productId, quantity });
            }
            await eixistingCart.save(); // Persist changes to the cart
        } else {
            const newCart = new CartModel({
                userId,
                products: [{ productId, quantity }]
            });
            await newCart.save();
        }
        return res.status(200).json({
            message: "Product added to cart successfully",
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Error adding to cart:", error);
        return res.status(500).json({
            message: "Error adding to cart",
            success: false
        })
    }
}

// export const getCartController = async (req, res) => {
//     try {
//         const { userId } = req.userId;

//         if (!userId) {
//             return res.status(401).json({
//                 message: "Unauthorized access",
//                 error: true,
//                 success: false
//             });
//         }

//         const cart = await CartModel.findOne({ userId }).populate("products.productId");

//         if (!cart) {
//             return res.status(404).json({
//                 message: "Cart not found",
//                 error: true,
//                 success: false
//             });
//         }

//         return res.status(200).json({
//             message: "Cart fetched successfully",
//             data: cart,
//             error: false,
//             success: true
//         });


//     } catch (error) {
//         return res.status(500).json({
//             message: "Error fetching cart" + error.message,
//             error: error,
//             success: false
//         })
//     }
// }

export const getCartDetailsController = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }

        const cart = await CartModel.findOne({ userId }).populate("products.productId");

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }
        const cartDetails = {
            products: cart.products
                .filter(product => product.productId) // Exclude entries with missing product
                .map((product) => ({
                    productId: product.productId._id,
                    name: product.productId.name,
                    price: product.productId.price,
                    quantity: product.quantity
                }))
        };

        return res.status(200).json({
            message: "Cart details fetched successfully",
            data: cartDetails,
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching cart details" + error.message,
            error: error,
            success: false
        })
    }
}

export const removeFromCartController = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId } = req.params;
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }

        const cart = await CartModel.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }
        const productIndex = cart.products.findIndex(
            (product) => product.productId.toString() === productId
        );

        if (productIndex > -1) {
            cart.products.splice(productIndex, 1);
            await cart.save();
            return res.status(200).json({
                message: "Product removed from cart successfully",
                error: false,
                success: true
            });
        } else {
            return res.status(404).json({
                message: "Product not found in cart",
                error: true,
                success: false
            });
        }


    } catch (error) {
        return res.status(500).json({
            message: "Error removing from cart" + error.message,
            error: error,
            success: false
        })
    }
}

export const clearCartController = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }

        const cart = await CartModel.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }

        cart.products = [];
        await cart.save();

        return res.status(200).json({
            message: "Cart cleared successfully",
            error: false,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error clearing cart" + error.message,
            error: error,
            success: false
        })
    }
}

export const updateCartController = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }

        const cart = await CartModel.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }

        const productIndex = cart.products.findIndex(
            (product) => product.productId.toString() === productId
        );

        if (productIndex > -1) {
            if (parsedQuantity === 0) {
                // Remove product if quantity is set to 0
                cart.products.splice(productIndex, 1);
                await cart.save();
                return res.status(200).json({
                    message: "Product removed from cart successfully",
                    error: false,
                    success: true
                });
            } else if (parsedQuantity >= 1) {
                cart.products[productIndex].quantity = parsedQuantity;
                await cart.save();
                return res.status(200).json({
                    message: "Product quantity updated successfully",
                    error: false,
                    success: true
                });
            }
        } else {
            return res.status(404).json({
                message: "Product not found in cart",
                error: true,
                success: false
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Error updating cart" + error.message,
            error: error,
            success: false
        })

    }
}

export const getCartItemCountController = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }

        const cart = await CartModel.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }

        const itemCount = cart.products.reduce((total, product) => total + product.quantity, 0);

        return res.status(200).json({
            message: "Cart item count fetched successfully",
            data: { itemCount },
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching cart item count" + error.message,
            error: error,
            success: false
        })
    }
}

export const getCartTotalAmountController = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }

        const cart = await CartModel.findOne({ userId }).populate("products.productId");

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                error: true,
                success: false
            });
        }

        const totalAmount = cart.products.reduce((total, product) => {
            // Use populated productId to access price, guard against missing product
            const price = product.productId && product.productId.price ? product.productId.price : 0;
            return total + (price * product.quantity);
        }, 0);

        return res.status(200).json({
            message: "Cart total amount fetched successfully",
            data: { totalAmount },
            error: false,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching cart total amount" + error.message,
            error: error,
            success: false
        })
    }
}

