import FAQModel from "../models/faq.model.js";
import ProductModel from "../models/product.model.js";

// Get all FAQs for a product
export const getFaqsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const faqs = await FAQModel.find({
            productId,
            isActive: true
        }).select("question answer createdAt");

        res.status(200).json({
            error: false,
            faqs
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

// Create FAQ (seller only)
export const createFaq = async (req, res) => {
    try {
        const { productId, question, answer } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized - User not found"
            });
        }

        // Verify product exists and belongs to seller
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                error: true,
                message: "Product not found"
            });
        }

        if (String(product.createdBy) !== String(userId)) {
            return res.status(403).json({
                error: true,
                message: "You can only manage FAQs for your own products"
            });
        }

        if (!question || !answer) {
            return res.status(400).json({
                error: true,
                message: "Question and answer are required"
            });
        }

        const faq = new FAQModel({
            productId,
            sellerId: userId,
            question,
            answer,
            isActive: true
        });

        const savedFaq = await faq.save();

        res.status(201).json({
            error: false,
            message: "FAQ created successfully",
            faq: savedFaq
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

// Update FAQ (seller only)
export const updateFaq = async (req, res) => {
    try {
        const { faqId } = req.params;
        const { question, answer } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized - User not found"
            });
        }

        const faq = await FAQModel.findById(faqId);
        if (!faq) {
            return res.status(404).json({
                error: true,
                message: "FAQ not found"
            });
        }

        if (String(faq.sellerId) !== String(userId)) {
            return res.status(403).json({
                error: true,
                message: "You can only edit your own FAQs"
            });
        }

        if (question) faq.question = question;
        if (answer) faq.answer = answer;

        const updatedFaq = await faq.save();

        res.status(200).json({
            error: false,
            message: "FAQ updated successfully",
            faq: updatedFaq
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

// Delete FAQ (seller only)
export const deleteFaq = async (req, res) => {
    try {
        const { faqId } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized - User not found"
            });
        }

        const faq = await FAQModel.findById(faqId);
        if (!faq) {
            return res.status(404).json({
                error: true,
                message: "FAQ not found"
            });
        }

        if (String(faq.sellerId) !== String(userId)) {
            return res.status(403).json({
                error: true,
                message: "You can only delete your own FAQs"
            });
        }

        await FAQModel.findByIdAndDelete(faqId);

        res.status(200).json({
            error: false,
            message: "FAQ deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

// Get FAQs for seller's product (admin panel)
export const getSellerFaqsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized - User not found"
            });
        }

        // Verify product belongs to seller
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                error: true,
                message: "Product not found"
            });
        }

        if (String(product.createdBy) !== String(userId)) {
            return res.status(403).json({
                error: true,
                message: "You can only view FAQs for your own products"
            });
        }

        const faqs = await FAQModel.find({
            productId,
            sellerId: userId
        });

        res.status(200).json({
            error: false,
            faqs
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};
