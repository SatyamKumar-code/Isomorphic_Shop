import AddressModel from "../models/address.model.js";

export const AddAddressesController = async (req, res) => {
    try {
        const { address_line1, city, state, pincode, country, mobile, landmark, addressType} = req.body;
        const userId = req.userId;

        if (!address_line1 || !city || !state || !pincode || !country || !mobile || !landmark || !addressType ) {
            return res.status(400).json({
                message: "All fields are required",
                error: true,
                success: false,
            });
        }

        const address = new AddressModel({
            address_line1,
            city,
            state,
            pincode,
            country,
            mobile,
            landmark,
            addressType,
            userId
        })

        const savedAddress = await address.save();

        return res.status(201).json({
            message: "Address added successfully",
            error: false,
            success: true,
            data: savedAddress
        });

    } catch (error) {
        return res.status(500).json({
        message: error.message || error,
        error: true,
        success: false,
        })
    }
}


export const getAddressesController = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }
        const address = await AddressModel.find({ userId });

        if (address.length === 0) {
            return res.status(404).json({
                message: "No addresses found",
                error: true,
                success: false,
            });
        }

        return res.status(200).json({
            message: "Addresses fetched successfully",
            error: false,
            success: true,
            address: address
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        })
    }
}

export const deleteAddressController = async ( req, res ) => {
    try {

        const userId = req.userId;
        const _id = req.params.id


        if(!_id) {
            return res.status(400).json({
                message: "provide _id",
                error: true,
                success: false
            })
        }
        const deleteItem = await AddressModel.deleteOne({
            _id: _id,
            userId: userId
        });

        if (deleteItem.deletedCount === 0) {
            return res.status(404).json({
                message: "The address in the database is not found",
                error: true,
                success: false
            });
        }


        return res.status(200).json({
            message: "Address remove",
            success: true,
            error: false, 
            data: deleteItem
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const getSingleAddressController = async ( req, res ) => {
    try {
        const id = req.params.id;
        const userId = req.userId;

        if(!id) {
            return res.status(400).json({
                message: "provide _id",
                error: true,
                success: false
            })
        }

        const address = await AddressModel.findOne({ _id: id, userId: userId });

        if(!address) {
            return res.status(404).json({
                message: "Address not found",
                error: true,
                success: false
            })
        }

        return res.status(200).json({
            message: "Address fetched successfully",
            error: false,
            success: true,
            address: address
        });


    }catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const editAddressController = async ( req, res ) => {
    try {

        const id = req.params.id;
        const userId = req.userId;
        const { address_line1, city, state, pincode, country, mobile, landmark, addressType} = req.body;

        // Verify ownership first
        const existingAddress = await AddressModel.findOne({ _id: id, userId: userId });
        
        if(!existingAddress) {
            return res.status(404).json({
                message: "Address not found",
                error: true,
                success: false
            })
        }

        // Build update object with only provided fields
        const allowedFields = [
            "address_line1", "city", "state", "pincode", "country", "mobile", "landmark", "addressType"
        ];
        const updateObj = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updateObj[key] = req.body[key];
            }
        }

        const address = await AddressModel.findByIdAndUpdate(id, updateObj, { new: true });

        return res.status(200).json({
            message: "Address updated successfully",
            error: false,
            success: true,
            address: address
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}
