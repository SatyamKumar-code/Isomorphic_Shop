import express from "express";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import ProductModel from "../models/product.model.js";
import mongoose from "mongoose";
import ReviewModel from "../models/review.model.js";
import UserModel from "../models/user.model.js";

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

// image upload
var imagesArr = [];

const hasGlobalAdminAccess = async (adminId) => {
    if (!adminId) {
        return false;
    }

    const admin = await UserModel.findById(adminId).select("role").lean();
    return Boolean(admin?.role === "admin");
};

export async function uploadImages(req, res) {
    try {
        imagesArr = [];

        const files = Array.isArray(req.files)
            ? req.files
            : req.file
                ? [req.file]
                : [];

        if (!files.length) {
            return res.status(400).json({
                message: "No image file uploaded",
                error: true,
                success: false,
            });
        }

        const option = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        for (let i = 0; i < files.length; i++) {
            const result = await cloudinary.uploader.upload(files[i].path, option);
            imagesArr.push(result.secure_url);
            if (fs.existsSync(files[i].path)) {
                fs.unlinkSync(files[i].path);
            }
        }


        return res.status(200).json({
            images: imagesArr,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function removeImageFromCloudinary(request, response) {
    try {
        const imgUrl = request.query.img;
        if (!imgUrl) {
            return response.status(400).json({
                message: "Image URL is required",
                error: true,
                success: false
            });
        }

        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];
        const imageName = image.split(".")[0];

        if (!imageName) {
            return response.status(400).json({
                message: "Invalid image name parsed from URL",
                error: true,
                success: false
            });
        }

        // Use promise form for better error handling
        try {
            const result = await cloudinary.uploader.destroy(imageName);
            if (result && (result.result === "ok" || result.result === "not found")) {
                return response.status(200).json({
                    error: false,
                    success: true,
                    message: "Image deleted successfully"
                });
            } else {
                return response.status(500).json({
                    message: result && result.result ? result.result : "Failed to delete image",
                    error: true,
                    success: false
                });
            }
        } catch (err) {
            return response.status(500).json({
                message: err.message || err,
                error: true,
                success: false
            });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const createProductController = async (req, res) => {
    try {
        const adminId = req.userId;
        const {
            productName,
            price,
            oldPrice,
            productPrice,
            discountPercentage,
            discount,
            description,
            brand,
            category,
            subCategory,
            size,
            weight,
            RAM,
            ROM,
            color,
            featured,
            stock,
            images,
            expirationStart,
            expirationEnd,
        } = req.body;
        const requestImages = Array.isArray(images) ? images : [];
        const parsedOldPrice = Number(oldPrice ?? productPrice ?? price ?? 0);
        const parsedDiscountPercentage = Math.min(Math.max(Number(discountPercentage ?? discount ?? 0), 0), 99);
        const parsedSalePrice = Number(price ?? 0);
        const parsedExpirationStart = expirationStart ? new Date(expirationStart) : null;
        const parsedExpirationEnd = expirationEnd ? new Date(expirationEnd) : null;
        const parsedRAM = RAM ?? req.body.Ram ?? '';
        const parsedROM = ROM ?? req.body.Rom ?? '';

        // Validate required fields
        if (!productName || !description || !stock || !parsedOldPrice || !parsedSalePrice) {
            return res.status(400).json({
                message: "Product name, price, description, and stock are required",
                success: false,
                error: true
            });
        }
        // Create a new product object
        const newProduct = new ProductModel({
            productName,
            price: parsedSalePrice,
            oldPrice: parsedOldPrice,
            discountPercentage: parsedDiscountPercentage,
            description,
            brand,
            category,
            subCategory,
            images: requestImages.length ? requestImages : imagesArr,
            size,
            weight,
            RAM: parsedRAM,
            ROM: parsedROM,
            color,
            featured: Boolean(featured),
            stock,
            expirationStart: parsedExpirationStart,
            expirationEnd: parsedExpirationEnd,
            createdBy: adminId || null,
        });

        if (!newProduct) {
            imagesArr = []; // Clear the images array if product creation fails
            return res.status(400).json({
                message: "Failed to create product",
                success: false,
                error: true
            });
        }

        // Save the product to the database
        await newProduct.save();
        imagesArr = []; // Clear the images array after saving the product

        return res.status(201).json({
            message: "Product created successfully",
            success: true,
            error: false
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in creating product: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getAdminProductsController = async (req, res) => {
    try {
        const adminId = req.userId;
        if (!adminId) {
            return res.status(401).json({
                message: "Unauthorized access",
                success: false,
                error: true,
            });
        }

        const globalAccess = await hasGlobalAdminAccess(adminId);
        const previousCreatedBy = req.query.createdBy;
        req.query.createdBy = globalAccess ? "" : String(adminId);
        await getAllProductsController(req, res);
        req.query.createdBy = previousCreatedBy;
    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching admin products: " + error.message,
            success: false,
            error: true,
        });
    }
};

export const getAllProductsController = async (req, res) => {
    try {
        const sortBy = req.query.sortBy;
        const createdBy = String(req.query.createdBy || "").trim();
        const rawPage = Number(req.query.page || 1);
        const rawLimit = Number(req.query.limit || 10);
        const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
        const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 10;
        const search = String(req.query.search || '').trim();
        const paginate = req.query.paginate === 'true' || Boolean(req.query.page) || Boolean(req.query.limit) || Boolean(search);

        let sortStage = null;
        let filterStage = null;
        switch (sortBy) {
            case "a-z": sortStage = { $sort: { productName: 1 } }; break;
            case "z-a": sortStage = { $sort: { productName: -1 } }; break;
            case "priceLow": sortStage = { $sort: { price: 1 } }; break;
            case "priceHigh": sortStage = { $sort: { price: -1 } }; break;
            case "ratingLow": sortStage = { $sort: { rating: 1 } }; break;
            case "ratingHigh": sortStage = { $sort: { rating: -1 } }; break;
            case "latest": sortStage = { $sort: { createdAt: -1, _id: -1 } }; break;
            case "oldest": sortStage = { $sort: { createdAt: 1, _id: 1 } }; break;
            case "stockHigh": sortStage = { $sort: { stock: -1, _id: -1 } }; break;
            case "stockLow": sortStage = { $sort: { stock: 1, _id: 1 } }; break;
            case "salesHigh": sortStage = { $sort: { sales: -1, _id: -1 } }; break;
            case "salesLow": sortStage = { $sort: { sales: 1, _id: 1 } }; break;
            case "outOfStock":
                filterStage = { $match: { stock: { $lte: 0 } } };
                sortStage = { $sort: { createdAt: -1, _id: -1 } };
                break;
            case "featured":
                filterStage = { $match: { featured: true } };
                sortStage = { $sort: { createdAt: -1, _id: -1 } };
                break;
        }

        const basePipeline = [];

        if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
            basePipeline.push({
                $match: {
                    createdBy: new mongoose.Types.ObjectId(createdBy),
                },
            });
        }

        basePipeline.push(
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [{ $project: { catName: 1 } }]
                }
            },
            {
                $lookup: {
                    from: "subcategories",
                    localField: "subCategory",
                    foreignField: "_id",
                    as: "subCategory",
                    pipeline: [{ $project: { subCatName: 1 } }]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy",
                    pipeline: [{ $project: { name: 1, email: 1 } }],
                }
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } }
        );

        if (search) {
            const safePattern = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(safePattern, 'i');
            basePipeline.push({
                $match: {
                    $or: [
                        { productName: searchRegex },
                        { description: searchRegex },
                        { "category.catName": searchRegex },
                        { "subCategory.subCatName": searchRegex },
                    ]
                }
            });
        }

        if (filterStage) {
            basePipeline.push(filterStage);
        }

        if (sortStage) {
            basePipeline.push(sortStage);
        } else if (paginate) {
            // Stable default sort is required for deterministic pagination.
            basePipeline.push({ $sort: { createdAt: -1, _id: -1 } });
        } else {
            basePipeline.push({ $sample: { size: await ProductModel.countDocuments() } });
        }

        if (!paginate) {
            const products = await ProductModel.aggregate(basePipeline);
            return res.status(200).json({
                message: "Products fetched successfully",
                success: true,
                error: false,
                products
            });
        }

        const skip = (page - 1) * limit;
        const paginatedPipeline = [
            ...basePipeline,
            {
                $facet: {
                    products: [
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ];

        const result = await ProductModel.aggregate(paginatedPipeline);
        const products = result?.[0]?.products || [];
        const totalCount = result?.[0]?.totalCount?.[0]?.count || 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / limit));

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            error: false,
            products,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching products: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getAdminProductByIdController = async (req, res) => {
    try {
        const productId = req.params.id;
        const adminId = req.userId;
        const globalAccess = await hasGlobalAdminAccess(adminId);

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true,
            });
        }

        const query = globalAccess ? { _id: productId } : { _id: productId, createdBy: adminId };
        const product = await ProductModel.findOne(query)
            .populate("category", "catName")
            .populate("subCategory", "subCatName");

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true,
            });
        }

        return res.status(200).json({
            message: "Product fetched successfully",
            success: true,
            error: false,
            product,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching admin product: " + error.message,
            success: false,
            error: true,
        });
    }
};

export const getProductByIdController = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        const product = await ProductModel.findById(productId)
            .populate("category", "catName")
            .populate("subCategory", "subCatName");

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Product fetched successfully",
            success: true,
            error: false,
            product
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching product: " + error.message,
            success: false,
            error: true
        })
    }
}

export const updateProductController = async (req, res) => {
    try {
        const productId = req.params.id;
        const adminId = req.userId;
        const globalAccess = await hasGlobalAdminAccess(adminId);
        const {
            productName,
            price,
            oldPrice,
            productPrice,
            discountPercentage,
            discount,
            description,
            brand,
            category,
            subCategory,
            size,
            weight,
            RAM,
            ROM,
            color,
            featured,
            stock,
            expirationStart,
            expirationEnd,
        } = req.body;
        const parsedOldPrice = Number(oldPrice ?? productPrice ?? 0);
        const parsedDiscountPercentage = Math.min(Math.max(Number(discountPercentage ?? discount ?? 0), 0), 99);
        const parsedExpirationStart = expirationStart ? new Date(expirationStart) : null;
        const parsedExpirationEnd = expirationEnd ? new Date(expirationEnd) : null;
        const parsedRAM = RAM ?? req.body.Ram;
        const parsedROM = ROM ?? req.body.Rom;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        // Build update object
        const updateObj = { productName, price, description, brand, category, subCategory, size, weight, color, stock };
        if (featured !== undefined) {
            updateObj.featured = Boolean(featured);
        }
        if (parsedOldPrice > 0) {
            updateObj.oldPrice = parsedOldPrice;
        }
        if (Number.isFinite(parsedDiscountPercentage)) {
            updateObj.discountPercentage = parsedDiscountPercentage;
        }
        if (parsedRAM !== undefined) {
            updateObj.RAM = parsedRAM;
        }
        if (parsedROM !== undefined) {
            updateObj.ROM = parsedROM;
        }
        updateObj.expirationStart = parsedExpirationStart;
        updateObj.expirationEnd = parsedExpirationEnd;
        let usedImagesArr = false;
        if (imagesArr && imagesArr.length > 0) {
            updateObj.images = imagesArr;
            usedImagesArr = true;
        }

        const updatedProduct = await ProductModel.findOneAndUpdate(
            globalAccess ? { _id: productId } : { _id: productId, createdBy: adminId },
            { $set: updateObj },
            { new: true }
        );

        if (usedImagesArr) imagesArr = []; // Only clear if used

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Product updated successfully",
            success: true,
            error: false,
            product: updatedProduct
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in updating product: " + error.message,
            success: false,
            error: true
        })
    }
}

export const deleteProductController = async (req, res) => {
    try {
        const productId = req.params.id;
        const adminId = req.userId;
        const globalAccess = await hasGlobalAdminAccess(adminId);
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        const deletedProduct = await ProductModel.findOneAndDelete(globalAccess ? { _id: productId } : { _id: productId, createdBy: adminId });

        if (!deletedProduct) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        await ReviewModel.deleteMany({ productId: productId });

        const images = deletedProduct.images;
        let img = "";
        for (img of images) {
            const imgUrl = img;
            const urlArr = imgUrl.split("/");
            const image = urlArr[urlArr.length - 1];

            const imageName = image.split(".")[0];

            if (imageName) {
                cloudinary.uploader.destroy(imageName, (error, result) => {
                    //console.log(result, error);
                });
            }
        }

        return res.status(200).json({
            message: "Product deleted successfully",
            success: true,
            error: false
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in deleting product: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getProductsByCategoryIdController = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        if (!categoryId) {
            return res.status(400).json({
                message: "Category ID is required",
                success: false,
                error: true
            });
        }

        const sortBy = req.query.sortBy;
        let sortStage = null;
        switch (sortBy) {
            case "a-z": sortStage = { $sort: { productName: 1 } }; break;
            case "z-a": sortStage = { $sort: { productName: -1 } }; break;
            case "priceLow": sortStage = { $sort: { price: 1 } }; break;
            case "priceHigh": sortStage = { $sort: { price: -1 } }; break;
            case "ratingLow": sortStage = { $sort: { rating: 1 } }; break;
            case "ratingHigh": sortStage = { $sort: { rating: -1 } }; break;
        }

        const pipeline = [
            { $match: { category: new mongoose.Types.ObjectId(categoryId) } },
        ];
        if (sortStage) {
            pipeline.push(sortStage);
        } else {
            pipeline.push({ $sample: { size: await ProductModel.countDocuments({ category: categoryId }) } });
        }

        const products = await ProductModel.aggregate(pipeline);

        if (!products || products.length === 0) {
            return res.status(404).json({
                message: "No products found for this category",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            error: false,
            products
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching products by category: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getProductsBySubCategoryIdController = async (req, res) => {
    try {
        const subCategoryId = req.params.subCategoryId;
        if (!subCategoryId) {
            return res.status(400).json({
                message: "Subcategory ID is required",
                success: false,
                error: true
            });
        }

        const sortBy = req.query.sortBy;
        let sortStage = null;
        switch (sortBy) {
            case "a-z": sortStage = { $sort: { productName: 1 } }; break;
            case "z-a": sortStage = { $sort: { productName: -1 } }; break;
            case "priceLow": sortStage = { $sort: { price: 1 } }; break;
            case "priceHigh": sortStage = { $sort: { price: -1 } }; break;
            case "ratingLow": sortStage = { $sort: { rating: 1 } }; break;
            case "ratingHigh": sortStage = { $sort: { rating: -1 } }; break;
        }

        const pipeline = [
            { $match: { subCategory: new mongoose.Types.ObjectId(subCategoryId) } },
        ];
        if (sortStage) {
            pipeline.push(sortStage);
        } else {
            pipeline.push({ $sample: { size: await ProductModel.countDocuments({ subCategory: subCategoryId }) } });
        }

        const products = await ProductModel.aggregate(pipeline);

        if (!products || products.length === 0) {
            return res.status(404).json({
                message: "No products found for this subcategory",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            error: false,
            products
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching products by subcategory: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getTopRatedProductsController = async (req, res) => {
    try {
        const topRatedProducts = await ProductModel.find().sort({ rating: -1 }).limit(10);

        if (!topRatedProducts || topRatedProducts.length === 0) {
            return res.status(404).json({
                message: "No top-rated products found",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Top-rated products fetched successfully",
            success: true,
            error: false,
            products: topRatedProducts
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching top-rated products: " + error.message,
            success: false,
            error: true
        })

    }
}

export const getLatestProductsController = async (req, res) => {
    try {
        const latestProducts = await ProductModel.find().sort({ createdAt: -1 }).limit(10);

        if (!latestProducts || latestProducts.length === 0) {
            return res.status(404).json({
                message: "No latest products found",
                success: false,
                error: true
            });
        }

        return res.status(200).json({
            message: "Latest products fetched successfully",
            success: true,
            error: false,
            products: latestProducts
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching latest products: " + error.message,
            success: false,
            error: true
        })
    }
}

export const searchProductsController = async (req, res) => {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.status(400).json({
                message: "Search term is required",
                success: false,
                error: true
            });
        }

        // Find matching category & subCategory IDs by name
        const [matchingCategories, matchingSubCategories] = await Promise.all([
            mongoose.model("category").find(
                { $text: { $search: searchTerm } },
                { _id: 1 }
            ),
            mongoose.model("subcategory").find(
                { $text: { $search: searchTerm } },
                { _id: 1 }
            )
        ]);

        const categoryIds = matchingCategories.map(c => c._id);
        const subCategoryIds = matchingSubCategories.map(s => s._id);

        // $text searches across all text-indexed fields (productName, description, size, weight, RAM, color)
        // MongoDB $text automatically splits the search term into words and matches each word
        const searchConditions = [
            { $text: { $search: searchTerm } },
        ];

        if (categoryIds.length > 0) {
            searchConditions.push({ category: { $in: categoryIds } });
        }
        if (subCategoryIds.length > 0) {
            searchConditions.push({ subCategory: { $in: subCategoryIds } });
        }

        // Sort options: a-z, z-a, priceLow, priceHigh, ratingLow, ratingHigh
        const sortBy = req.query.sortBy;
        let sortOption = {};
        switch (sortBy) {
            case "a-z": sortOption = { productName: 1 }; break;
            case "z-a": sortOption = { productName: -1 }; break;
            case "priceLow": sortOption = { price: 1 }; break;
            case "priceHigh": sortOption = { price: -1 }; break;
            case "ratingLow": sortOption = { Rating: 1 }; break;
            case "ratingHigh": sortOption = { Rating: -1 }; break;
            default: sortOption = {};
        }

        const products = await ProductModel.find({ $or: searchConditions })
            .populate("category", "catName")
            .populate("subCategory", "subCatName")
            .sort(sortOption);

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            error: false,
            products
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in searching products: " + error.message,
            success: false,
            error: true
        })
    }
}

export const filterProductsController = async (req, res) => {
    try {
        const { category, subCategory } = req.query;
        let { minPrice, maxPrice, minRating } = req.query;
        const filterConditions = {};

        if (category) {
            filterConditions.category = category;
        }
        if (subCategory) {
            filterConditions.subCategory = subCategory;
        }

        // Coerce to numbers and guard against NaN
        const minPriceNum = Number(minPrice);
        const maxPriceNum = Number(maxPrice);
        const minRatingNum = Number(minRating);

        if (Number.isFinite(minPriceNum) && Number.isFinite(maxPriceNum)) {
            filterConditions.price = { $gte: minPriceNum, $lte: maxPriceNum };
        }
        if (Number.isFinite(minRatingNum)) {
            filterConditions.rating = { $gte: minRatingNum };
        }

        // Sort options: a-z, z-a, priceLow, priceHigh, ratingLow, ratingHigh
        const sortBy = req.query.sortBy;
        let sortOption = {};
        switch (sortBy) {
            case "a-z": sortOption = { productName: 1 }; break;
            case "z-a": sortOption = { productName: -1 }; break;
            case "priceLow": sortOption = { price: 1 }; break;
            case "priceHigh": sortOption = { price: -1 }; break;
            case "ratingLow": sortOption = { rating: 1 }; break;
            case "ratingHigh": sortOption = { rating: -1 }; break;
            default: sortOption = {};
        }

        const products = await ProductModel.find(filterConditions)
            .populate("category", "catName")
            .populate("subCategory", "subCatName")
            .sort(sortOption);

        return res.status(200).json({
            message: "Products filtered successfully",
            success: true,
            error: false,
            products
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in filtering products: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getRelatedProductsController = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        const relatedProducts = await ProductModel.find({
            _id: { $ne: productId },
            $or: [
                { category: product.category },
                { subCategory: product.subCategory }
            ]
        });

        return res.status(200).json({
            message: "Related products fetched successfully",
            success: true,
            error: false,
            products: relatedProducts
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching related products: " + error.message,
            success: false,
            error: true
        })
    }
}

export const createProductReviewController = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.userId;
        const { rating, comment } = req.body;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }
        if (!rating) {
            return res.status(400).json({
                message: "Rating is required",
                success: false,
                error: true
            });
        }
        if (!comment) {
            return res.status(400).json({
                message: "Comment is required",
                success: false,
                error: true
            });
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
                error: true
            });
        }

        const existingReview = await ReviewModel.findOne({ productId, userId });
        if (existingReview) {
            return res.status(400).json({
                message: "You have already reviewed this product",
                success: false,
                error: true
            });
        }

        const newReview = new ReviewModel({
            userId,
            productId,
            rating,
            comment,
            status: "Pending"
        });
        await newReview.save();

        // Update product's average rating
        const reviews = await ReviewModel.find({ productId });
        const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
        product.rating = averageRating;
        await product.save();

        return res.status(201).json({
            message: "Review created successfully",
            success: true,
            error: false
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error in creating product review: " + error.message,
            success: false,
            error: true
        })
    }
}

export const getProductReviewsController = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                success: false,
                error: true
            });
        }

        const reviews = await ReviewModel.find({ productId })
            .populate("userId", "name avatar")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Product reviews fetched successfully",
            success: true,
            error: false,
            reviews
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error in fetching product reviews: " + error.message,
            success: false,
            error: true
        })
    }
}

