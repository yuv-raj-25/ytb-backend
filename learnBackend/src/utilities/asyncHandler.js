const asyncHandler  = (requestHandler) => {
    return (req , res , next) =>{
        Promise.resolve(requestHandler(req , res , next))
        .catch((err) => next(err))
    }
}

export {asyncHandler}








// const asyncHandler = ()=>{}
// const asyncHandler = (fn)=> () =>{}
// const asyncHandler = (fn) => async() => {}

// another way of doing 

// const asyncHandler = (fn) => (req , res , next) =>{
//     try {
        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }