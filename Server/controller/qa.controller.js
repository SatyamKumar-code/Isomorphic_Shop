import QAModel from "../models/qa.model.js";
import ProductModel from "../models/product.model.js";
import JWT from "jsonwebtoken";

// Get all Q&A for a product (public - shows only answered, plus user's own unanswered)
export const getQaByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // Try to get user ID if logged in (optional)
        let userId = null;
        const token = req.cookies?.accessToken || req?.headers?.authorization?.split(" ")[1];
        if (token) {
            try {
                const decoded = JWT.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
                userId = decoded?.id;
            } catch (err) {
                // Token invalid or expired, continue as anonymous
                userId = null;
            }
        }

        // Get all answered questions (public)
        const answeredQas = await QAModel.find({
            productId,
            isActive: true,
            isAnswered: true
        }).populate('userId', 'name avatar').select("question answer isAnswered createdAt updatedAt").sort({ createdAt: -1 });

        let userUnansweredQas = [];
        // If user is logged in, get their own unanswered questions
        if (userId) {
            userUnansweredQas = await QAModel.find({
                productId,
                userId,
                isActive: true,
                isAnswered: false
            }).populate('userId', 'name avatar').select("question answer isAnswered createdAt updatedAt").sort({ createdAt: -1 });
        }

        const allQas = [...answeredQas, ...userUnansweredQas].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({
            error: false,
            qas: allQas
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

// Customer asks a question
export const createQuestion = async (req, res) => {
    try {
        const { productId, question } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized - User not found"
            });
        }

        // Verify product exists
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                error: true,
                message: "Product not found"
            });
        }

        if (!question || !question.trim()) {
            return res.status(400).json({
                error: true,
                message: "Question is required"
            });
        }

        const qa = new QAModel({
            productId,
            sellerId: product.createdBy,
            userId,
            question: question.trim(),
            isAnswered: false,
            isActive: true
        });

        const savedQa = await qa.save();
        await savedQa.populate('userId', 'name avatar');

        res.status(201).json({
            error: false,
            message: "Question posted successfully",
            qa: savedQa
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

// Seller answers a question
export const answerQuestion = async (req, res) => {
    try {
        const { qaId } = req.params;
        const { answer } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized - User not found"
            });
        }

        const qa = await QAModel.findById(qaId);
        if (!qa) {
            return res.status(404).json({
                error: true,
                message: "Question not found"
            });
        }

        if (String(qa.sellerId) !== String(userId)) {
            return res.status(403).json({
                error: true,
                message: "You can only answer questions for your own products"
            });
        }

        if (!answer || !answer.trim()) {
            return res.status(400).json({
                error: true,
                message: "Answer is required"
            });
        }

        qa.answer = answer.trim();
        qa.isAnswered = true;

        const updatedQa = await qa.save();
        await updatedQa.populate('userId', 'name avatar');

        res.status(200).json({
            error: false,
            message: "Answer posted successfully",
            qa: updatedQa
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

// Get all questions for seller's product (admin panel)
export const getSellerUnansweredQuestions = async (req, res) => {
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
                message: "You can only view questions for your own products"
            });
        }

        // Get ALL questions (answered and unanswered) for this product
        const qas = await QAModel.find({
            productId,
            sellerId: userId,
            isActive: true
        }).populate('userId', 'name avatar').sort({ isAnswered: 1, createdAt: -1 });

        res.status(200).json({
            error: false,
            qas,
            count: qas.length
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

// Delete question (user can delete their own, seller can delete any)
export const deleteQuestion = async (req, res) => {
    try {
        const { qaId } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized - User not found"
            });
        }

        const qa = await QAModel.findById(qaId);
        if (!qa) {
            return res.status(404).json({
                error: true,
                message: "Question not found"
            });
        }

        // User can delete their own question or seller can delete any
        if (String(qa.userId) !== String(userId) && String(qa.sellerId) !== String(userId)) {
            return res.status(403).json({
                error: true,
                message: "You cannot delete this question"
            });
        }

        await QAModel.findByIdAndDelete(qaId);

        res.status(200).json({
            error: false,
            message: "Question deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};
