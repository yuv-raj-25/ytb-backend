import mongoose , {Schema , model} from "mongoose";

const subcriptionSchema = Schema({

    subscribe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: false
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: false
    }
})

export const Subcription = mongoose.model("Subcription" , subcriptionSchema)