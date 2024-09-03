import {asyncHandler} from "../utilities/asyncHandler.js"
import {asyncHandler} from "../utilities/asyncHandler.js"
import {ApiError} from "../utilities/apiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utilities/cloudinary.js"
import { ApiResponse } from "../utilities/ApiResponse.js"


const generateAccessTokenAndRefreshToken = async(userId) => {

  try {
   const user  =  User.findById(userId);
   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()
   user.refreshToken = refreshToken
   user.save({validationBeforeSave: false})

   return {accessToken , refreshToken}

  } catch (error) {
    throw new ApiError(500 , "Something went wrong while generating the access & refresh token");

  }
}







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


// login user 

// 1. required  username , email
// 2. check if user exist in the DB or not if not show 401 and got to registeration page
// 3.  if exist then give access to the user 
// 4. kitne time ke liye access dena hai 
// 5. session expire kb krna hai 
// 6. 

const loginUser = asyncHandler( async (req , res ) => {

   const {username , email , password } = req.body
   
   // require data
   if (!username || !email) {
    throw  new ApiError(400 , "username and password is required ")
   }
   // find one in the database to check 
    const user = await User.findOne({
      $or: [{username } , {email}]
    })

    // check user exist or not 
   if(!user){
    throw new ApiError(401 , "this user does not exists ")
   }
  
   // check pass is correct or not 
   const isPasswordValid = await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(402 , "Invalid user password ")
   }

   const {accessToken , refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

   const loggedInUser = User.findById(user._id).select("-password -refreshToken")

   const options = {
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken , options)
   .cookie("refreshToken", refreshToken , options)
   .json(
    new ApiResponse(
      200,
      {
        user: username , accessToken , refreshToken
      },
      "User logged in successfully"
    )
   )

})

// logout user 
//1. clear the refresh token and access token 
//2. clear cookies

const logoutUser = asyncHandler(async (req , res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined
        }
      },
      {
        new: true
      }
    )  

    const options = {
      httpOnly: true,
      secure: true
    }


    return res
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200 , {} , "User logged Out successfully"))
    


})


export {
  registerUser,
  loginUser,
  logoutUser
}