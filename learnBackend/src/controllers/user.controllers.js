import {asyncHandler} from "../utilities/asyncHandler.js"
import {ApiError} from "../utilities/apiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utilities/cloudinary.js"
import { ApiResponse } from "../utilities/ApiResponse.js"

// get User data from the frontend and we have to send this data to the database 
// we need name email password 
// validation -> not empty , correct email 
// check if user already exist : email
// check for images , check for avatar
// upload images to cloudinary , avtar 
// create user object , create entry in DB
// remove pass and refresh token from response
// check for user creation 
// return res


const registerUser = asyncHandler( async (req , res) => {

     const {fullName , username , email , password} = req.body
    //  console.log("email :" , email);

    //  if(fullName === ""){
    //     throw new ApiError(400 , "fullname is required ")
    //  }

    // another industry level method
    if(
        [fullName , username , email , password].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400 , "All fields are required ")
    }


    const existedUser =  await User.findOne({
        $or:[{username} , {email}]
    })

    // console.log("this user is already exists" , existedUser);

    if(existedUser){
        throw new ApiError(409 , "User with this username or email already exists")
    }

    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    // const coverImageLocalpath = req.files?.coverImage[0]?.path

    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
      
    }

    if(!avatarLocalPath){
        throw new ApiError(400 , "avatar file is required ")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
    throw new ApiError(400 , "Avatar file is required ")
   }

   const user = await User.create({
        fullName,
        password,
        email,
        username: username.toLowerCase(),
        avatar: avatar.url, 
        coverImage: coverImage?.url || "",
   })
   
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if(!createdUser){
    throw new ApiError(500 , "something went wrong while registering the User")
  }

  return res.status(201).json(
    new ApiResponse(200 , createdUser , "user registeration successfully")
  )

})

export {registerUser}