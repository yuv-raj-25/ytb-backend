// require('dotenv').config({path: './env'});

// Now all environment variables from .env are available via process.env

import dotenv  from "dotenv";
import connectDB from "./db/index.js";


dotenv.config({
    path: './env'
})


connectDB();

// const app = express();
/*
;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error" , (error) =>{
            console.log("error:" , error);
            throw error

        })

        app.listen(process.env.PORT , ()=>{
            console.log(`App is listening on the ${process.env.PORT}`);
        })
        
    } catch (error) {
        console.error("Error:" , error)
        throw error;    
    }
})()

*/