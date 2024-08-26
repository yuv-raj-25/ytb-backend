import mongoose from "mongoose";

const patientSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    diagnosed: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    bloodGroup: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        enum: ['MALE' , 'FEMALE' , 'OTHERS'],
        required: true,
    },
    admittedIn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true,
    },

} , {timestamps: true})

export const Patient = mongoose.model('Patient' , patientSchema)