import mongoose from "mongoose";

const SubtodoSchema = new mongoose.Schema(
    {

    },
    {timestamps: true}
)


export const Subtodo = mongoose.model('Subtodo', SubtodoSchema)
