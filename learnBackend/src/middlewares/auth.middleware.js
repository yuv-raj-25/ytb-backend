import { jwt } from "jsonwebtoken";
import { ApiError } from "../utilities/apiError.js";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler( async (req , res , next) => {
  try {
     const token =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "");
     
     if (!token) {
          throw new ApiError(401 , "Unauthorized request")
     }
     const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);
  
     const user = User.findById(decodedToken?._id)
     if (!user) {
          throw new ApiError(400 , "Invalid Access Token");
     }
     req.user = user;
     next();
  } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid access token")
  }
})