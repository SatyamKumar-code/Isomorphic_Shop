import express from 'express';
import categoryModel from "../models/category.model.js";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import subCatModel from "../models/subCategory.model.js";
import mongoose from "mongoose";

cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});

// image upload
var imagesArr = [];

const deleteCloudinaryImage = async (imgUrl) => {
    if (!imgUrl) return;

    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];
    const imageName = image.split(".")[0];

    if (imageName) {
        await cloudinary.uploader.destroy(imageName, () => { });
    }
};

export async function uploadImages(req, res) {
    try {
        imagesArr = [];

        const image = req.files;

        const option = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        for (let i = 0; i < image?.length; i++) {
            const result = await cloudinary.uploader.upload(image[i].path, option);
            imagesArr.push(result.secure_url);
            fs.unlinkSync(`uploads/${req.files[i].filename}`);
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

        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];

        const imageName = image.split(".")[0];

        if (imageName) {
            const res = await cloudinary.uploader.destroy(
                imageName,
                (error, result) => {

                }
            );
            if (res) {
                return response.status(200).json({
                    error: false,
                    success: true,
                    message: "Image deleted successfully"
                })
            }
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const createCategoryController = async (req, res) => {
    try {
        const { catName } = req.body;

        if (!catName) {
            return res.status(400).json({
                message: "Category Name is required",
                error: true,
                success: false
            })
        }

        const existingCategory = await categoryModel.findOne({ catName });

        if (existingCategory) {
            return res.status(400).json({
                message: "Category  already existed",
                error: true,
                success: false
            })
        }


        const newCategory = new categoryModel({
            catName: catName,
            image: imagesArr[0] // Assuming you want to store the first uploaded image
        });

        if (!newCategory) {
            return res.status(500).json({
                message: "Failed to create category",
                error: true,
                success: false
            })
        }

        await newCategory.save();
        imagesArr = [];

        return res.status(201).json({
            message: "Category created successfully",
            error: false,
            success: true,
            category: newCategory
        })



    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const updateCategoryController = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { catName, image } = req.body;

        const category = await categoryModel.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
                error: true,
                success: false
            });
        }

        if (catName) {
            const existingCategory = await categoryModel.findOne({
                catName,
                _id: { $ne: categoryId }
            });

            if (existingCategory) {
                return res.status(400).json({
                    message: "Category already existed",
                    error: true,
                    success: false
                });
            }

            category.catName = catName;
        }

        if (image && image !== category.image) {
            await deleteCloudinaryImage(category.image);
            category.image = image;
        }

        await category.save();

        return res.status(200).json({
            message: "Category updated successfully",
            error: false,
            success: true,
            category
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
}

export const getAllCategoriesController = async (req, res) => {
    try {
        let categories = await categoryModel.find();

        categories = categories.sort((a, b) => {
            if (a.catName && b.catName) {
                return a.catName.localeCompare(b.catName);
            }
            return 0;
        })

        if (categories.length === 0) {
            return res.status(404).json({
                message: "No categories found",
                error: true,
                success: false
            })
        }

        return res.status(200).json({
            message: "Categories retrieved successfully",
            error: false,
            success: true,
            categories
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const getAllSubCategoriesController = async (req, res) => {
    try {
        const categoryId = String(req.query.categoryId || '').trim();
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const pageSize = Math.max(1, parseInt(req.query.pageSize || '10', 10));
        const search = String(req.query.search || '').trim();

        const matchStage = {};

        if (categoryId) {
            matchStage.categoryId = new mongoose.Types.ObjectId(categoryId);
        }

        if (search) {
            matchStage.subCatName = { $regex: search, $options: 'i' };
        }

        const totalCount = await subCatModel.countDocuments(matchStage);
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

        const subCategories = await subCatModel.aggregate([
            Object.keys(matchStage).length ? { $match: matchStage } : { $match: {} },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [{ $project: { catName: 1, image: 1 } }],
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'subCategory',
                    as: 'products',
                    pipeline: [{ $project: { _id: 1 } }],
                },
            },
            {
                $addFields: {
                    productCount: { $size: '$products' },
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    products: 0,
                },
            },
            {
                $sort: { subCatName: 1, createdAt: -1 },
            },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
        ]);

        return res.status(200).json({
            message: 'Sub categories retrieved successfully',
            error: false,
            success: true,
            subCategories,
            totalCount,
            totalPages,
            page,
            pageSize,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false,
        });
    }
}

export const getCategoryByIdController = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await categoryModel.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
                error: true,
                success: false
            })
        }

        return res.status(200).json({
            message: "Category retrieved successfully",
            error: false,
            success: true,
            category
        })


    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const deleteCategoryController = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await categoryModel.findById(categoryId);
        await deleteCloudinaryImage(category?.image);

        const subCategories = await subCatModel.find({ categoryId });
        for (let subCategory of subCategories) {
            await subCatModel.findByIdAndDelete(subCategory._id);
        }

        await categoryModel.findByIdAndDelete(categoryId);

        return res.status(200).json({
            message: "Category and its subcategories deleted successfully",
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const CreateSubCategoryController = async (req, res) => {
    try {
        const { subCatName, categoryId } = req.body;

        if (!subCatName || !categoryId) {
            return res.status(400).json({
                message: "Sub Category Name and Category Id are required",
                error: true,
                success: false
            })
        }

        const existingSubCategory = await subCatModel.findOne({ subCatName, categoryId });

        if (existingSubCategory) {
            return res.status(400).json({
                message: "Sub Category already existed in this category",
                error: true,
                success: false
            })
        }

        const subCategory = new subCatModel({
            subCatName,
            categoryId
        });

        await subCategory.save();

        return res.status(201).json({
            message: "Sub Category created successfully",
            error: false,
            success: true,
            subCategory
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const getAllSubCategoriesByCategoryIdController = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const subCategories = await subCatModel.find({ categoryId });

        if (subCategories.length === 0) {
            return res.status(404).json({
                message: "No sub categories found for this category",
                error: true,
                success: false
            })
        }

        return res.status(200).json({
            message: "Sub categories retrieved successfully",
            error: false,
            success: true,
            subCategories
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const getSubCategoryByIdController = async (req, res) => {
    try {
        const subCategoryId = req.params.id;
        const subCategory = await subCatModel.findById(subCategoryId);
        if (!subCategory) {
            return res.status(404).json({
                message: "Sub category not found",
                error: true,
                success: false
            })
        }
        return res.status(200).json({
            message: "Sub category retrieved successfully",
            error: false,
            success: true,
            subCategory
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const deleteSubCategoryController = async (req, res) => {
    try {
        const subCategoryId = req.params.id;
        const subCategory = await subCatModel.findById(subCategoryId);

        if (!subCategory) {
            return res.status(404).json({
                message: "Sub category not found",
                error: true,
                success: false
            })
        }

        await subCatModel.findByIdAndDelete(subCategoryId);

        return res.status(200).json({
            message: "Sub category deleted successfully",
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        })
    }
}

export const updateSubCategoryController = async (req, res) => {
    try {
        const subCategoryId = req.params.id;
        const { subCatName, categoryId } = req.body;

        const subCategory = await subCatModel.findById(subCategoryId);

        if (!subCategory) {
            return res.status(404).json({
                message: "Sub category not found",
                error: true,
                success: false
            });
        }

        const nextCategoryId = categoryId || subCategory.categoryId;
        const nextSubCatName = subCatName || subCategory.subCatName;

        const existingSubCategory = await subCatModel.findOne({
            subCatName: nextSubCatName,
            categoryId: nextCategoryId,
            _id: { $ne: subCategoryId }
        });

        if (existingSubCategory) {
            return res.status(400).json({
                message: "Sub category already existed in this category",
                error: true,
                success: false
            });
        }

        subCategory.subCatName = nextSubCatName;
        subCategory.categoryId = nextCategoryId;

        await subCategory.save();

        return res.status(200).json({
            message: "Sub category updated successfully",
            error: false,
            success: true,
            subCategory
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            error: true,
            success: false
        });
    }
}