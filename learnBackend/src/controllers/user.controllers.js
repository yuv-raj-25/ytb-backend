import {asyncHandler} from "../utilities/asyncHandler.js"
import {ApiError} from "../utilities/apiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utilities/cloudinary.js"
import { ApiResponse } from "../utilities/ApiResponse.js"
// import jwt  from "jsonwebtoken"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessTokenAndRefreshToken = async(userId) =>{
  try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return {accessToken, refreshToken}


  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
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

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username and email are required");
  }
  console.log(email);

  // Find user by username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(401, "This user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(402, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

  // Fetch the user data without sensitive fields
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // console.log(loggedInUser);

  // Only return necessary fields to avoid circular references
  const safeUser = {
    id: loggedInUser._id,
    username: loggedInUser.username,
    email: loggedInUser.email,
  };

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: safeUser, // Ensure no circular references here
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// logout user 
//1. clear the refresh token and access token 
//2. clear cookies

const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
      req.user._id,
      {
          $unset: {
              refreshToken: 1 // this removes the field from document
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
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken  = asyncHandler( async (req ,  res ) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401 , "unauthorized request ")
  }
  const decodeToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
  const user = await User.findById(decodeToken?._id)

  if(!user){
    throw new ApiError(400 , "Invalid Refrrsh Token ")
  }

  if(incomingRefreshToken !== user?.refreshToken){
    throw new ApiError(401 , "Refresh Token is Expired or Used ")
  }

  const options = {
    httpOnly: true,
    secure: true
  }
  const {accessToken , newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
  return res 
  .status(200)
  .cookie("accessToken" ,accessToken , options )
  .cookie("refreshToken" ,newRefreshToken , options )
  .json(
    new ApiResponse(
      200 ,
      {accessToken , refreshToken: newRefreshToken},
      "Access Token Refresh"
    )
  )

})


const changeCurrentPassword = asyncHandler( async (req , res) =>{
  const {oldPassword , newPassword , confirmPassword } = req.body

  const user  = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400 , "Invalid old Password" )
  }
  
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  user.password =  newPassword
  await user.save({validateBeforeSave: false})

  return res 
  .status(200)
  .json(
    new ApiResponse(
      200 , {} , "Password change successfully"
    )
  )
})


const getCurrentUser = asyncHandler( async (req , res) => {
  return res
  .status(200)
  .json(
    new ApiResponse(200 , req.user , "Current User fetched Successfully")
  )

})

const updateAccountDetails = asyncHandler( async (req , res ) => {
  const {fullName , email} = req.body
  if(!fullName || ! email){
    throw new ApiError(400 , "All fields are required")
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        // can use both 
        fullName,
        email: email
      }
    },
    {new : true}
  ).select("-password")

  return res 
  .status(200)
  .json(
    new ApiResponse(200 , user , "Account details updated succesfully")
  )
})

const changeAvatar = asyncHandler( async (req , res) => {

  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400 , "Avatar is Missing")
  }

  // delete the old avatar 

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400 , "Error while uploading the avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }

    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(
      200 , user , "Avatar is Updated Successfully"
    )
  )

})

const changeCoverImage = asyncHandler( async (req , res) => {

  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400 , "coverImage is Missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400 , "Error while uploading the coverImage")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }

    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(
      200 , user , "CoverImage is Updated Successfully"
    )
  )

})

const getUserChannelProfile = asyncHandler( async (req , res ) => {
  const {username} = req.params
  if(!username?.trim()){
    throw new ApiError(400 , "Username is missing")
  }
  const channel  = User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        form: "subcription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        form: "subcription",
        localField: "_id",
        foreignField: "subscribe",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount :{
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribeed: {
          $cond: {
            if: {$in: [req.user?._id , "$subscribers.subscribe"]},
            then: true,
            else: false
          }
        }
      }
    },
    
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribeed: 1,
        email: 1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(400 , " Channel does not exist ")
  }

  return res 
  .status(200)
  .json(
    new ApiResponse(200 , channel[0] , " User Channel Fetch Successfully")
  )
})


const getWatchHistory = asyncHandler( async (req , res ) => {
  const user = await User.aggregate([
    {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
      $lookup: {
        from: "video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res 
  .status(200)
  .json(
    new ApiResponse(
      200 , user[0].watchHistory , "Watched HIstory fetched Successfully"
    )
  )
})




export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  changeAvatar,
  changeCoverImage,
  getUserChannelProfile,
  getWatchHistory
  
}