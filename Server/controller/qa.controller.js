import QAModel from "../models/qa.model.js";
import ProductModel from "../models/product.model.js";
import JWT from "jsonwebtoken";

// Get all Q&A for a product (private - only user's own questions visible)
export const getQaByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        // Try to get user ID if logged in (required for Q&A visibility)
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

        // Only show Q&A to the user who asked the question
        let userQas = [];
        if (userId) {
            userQas = await QAModel.find({
                productId,
                userId,
                isActive: true
            }).populate('userId', 'name avatar').select("question answer isAnswered createdAt updatedAt").sort({ createdAt: -1 });
        }

        res.status(200).json({
            error: false,
            qas: userQas
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
        const { page = 1, limit = 10, filter = "latest" } = req.query;

        if (!userId) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized - User not found"
            });
        }

        // Verify product belongs to seller
        const product = await ProductModel.findById(productId)
            .populate('category', 'catName')
            .populate('subCategory', 'subCatName');
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

        const parsedPage = Number.parseInt(page, 10);
        const parsedLimit = Number.parseInt(limit, 10);
        const safePage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
        const allowedLimits = [10, 20, 30, 50, 100];
        const safeLimit = allowedLimits.includes(parsedLimit) ? parsedLimit : 10;

        let statusFilter = {};
        let sortOption = { createdAt: -1 };

        if (filter === "oldest") {
            sortOption = { createdAt: 1 };
        }

        if (filter === "pending") {
            statusFilter = { isAnswered: false };
        }

        if (filter === "answered") {
            statusFilter = { isAnswered: true };
        }

        const baseQuery = {
            productId,
            sellerId: userId,
            isActive: true
        };

        const query = {
            ...baseQuery,
            ...statusFilter
        };

        const total = await QAModel.countDocuments(query);
        const skip = (safePage - 1) * safeLimit;

        const qas = await QAModel.find(query)
            .populate('userId', 'name avatar')
            .sort(sortOption)
            .skip(skip)
            .limit(safeLimit);

        const [totalCount, answeredCount, pendingCount] = await Promise.all([
            QAModel.countDocuments(baseQuery),
            QAModel.countDocuments({ ...baseQuery, isAnswered: true }),
            QAModel.countDocuments({ ...baseQuery, isAnswered: false })
        ]);

        res.status(200).json({
            error: false,
            product: {
                _id: product._id,
                productName: product.productName,
                price: product.price,
                images: product.images,
                category: product.category,
                subCategory: product.subCategory,
                stock: product.stock,
                description: product.description,
                rating: product.rating,
                sales: product.sales
            },
            qas,
            count: qas.length,
            stats: {
                total: totalCount,
                answered: answeredCount,
                pending: pendingCount
            },
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit) || 1,
                hasNextPage: skip + qas.length < total,
                hasPrevPage: safePage > 1
            },
            filter
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

// Get all products with Q&A counts (admin/seller view)
export const getProductsWithQACounts = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10, filter = 'all' } = req.query;

        if (!userId) {
            return res.status(401).json({
                error: true,
                message: "Unauthorized - User not found"
            });
        }

        // Get all products for the seller/admin
        const products = await ProductModel.find({ createdBy: userId })
            .select('_id productName images')
            .lean();

        // Get Q&A counts for each product with timestamps for sorting
        const productsWithCounts = await Promise.all(
            products.map(async (product) => {
                const qas = await QAModel.find({
                    productId: product._id,
                    isActive: true
                }).lean();

                const answeredCount = qas.filter(qa => qa.isAnswered).length;
                const unansweredCount = qas.filter(qa => !qa.isAnswered).length;
                const latestQuestion = qas.length > 0 ? Math.max(...qas.map(q => new Date(q.createdAt).getTime())) : 0;
                const oldestQuestion = qas.length > 0 ? Math.min(...qas.map(q => new Date(q.createdAt).getTime())) : 0;

                return {
                    _id: product._id,
                    productName: product.productName,
                    productImage: product.images?.[0] || '',
                    totalQA: qas.length,
                    answeredQA: answeredCount,
                    unansweredQA: unansweredCount,
                    latestQuestion,
                    oldestQuestion
                };
            })
        );

        // Filter to show only products with Q&As
        let productsWithQA = productsWithCounts.filter(p => p.totalQA > 0);

        // Apply filter: all | answered | pending | latest | oldest
        if (filter === 'answered') {
            productsWithQA = productsWithQA.filter(p => p.answeredQA > 0);
        } else if (filter === 'pending') {
            productsWithQA = productsWithQA.filter(p => p.unansweredQA > 0);
        } else if (filter === 'latest') {
            productsWithQA = productsWithQA.sort((a, b) => b.latestQuestion - a.latestQuestion);
        } else if (filter === 'oldest') {
            productsWithQA = productsWithQA.sort((a, b) => a.oldestQuestion - b.oldestQuestion);
        }

        // Pagination (safe param handling)
        const parsedPage = Number.parseInt(page, 10);
        const parsedLimit = Number.parseInt(limit, 10);
        const allowedLimits = [10, 20, 30, 50, 100];
        const safePage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
        const safeLimit = allowedLimits.includes(parsedLimit) ? parsedLimit : 10;

        const total = productsWithQA.length;
        const totalPages = Math.max(1, Math.ceil(total / safeLimit));
        const start = (safePage - 1) * safeLimit;
        const end = start + safeLimit;
        const paginated = productsWithQA.slice(start, end);

        res.status(200).json({
            error: false,
            products: paginated,
            count: paginated.length,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages,
                hasNextPage: safePage < totalPages,
                hasPrevPage: safePage > 1
            },
            filter
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};
