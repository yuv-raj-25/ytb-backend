import mongoose from "mongoose";

const orderItemsSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    quantity: {
        type: Number,
        required: true
    }
})

const addressSchema = mongoose.Schema({
    pincode: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    placeName: {
        type: String,
        required: true
    }

})

const orderSchema = mongoose.Schema({
    orderPrice: {
        type: Number,
        required: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
       
    },
    orderItems: {
        type: [orderItemsSchema],
        
    },
    address: {
        type: [addressSchema],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CANCELLED' , 'DELIVERED'],
      default: 'PENDING'
    },
},{timestamps: true})


export const Order = mongoose.model('Order' , orderSchema)