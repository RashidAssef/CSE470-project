import mongoose from 'mongoose';

/*
 [course_title,decription,category,difficulty,language,thumbnail_img,price
 instructor,createdAt,status, tags]
*/

const courseSchema = new mongoose.Schema({
    course_title :{
        type : String,
        required : [true, "Course Title is required"],
        trim : true,
        minlength : 5,
        maxlength : 100
    },
    description:{
        type : String,
        required : true,
        maxlength : 1000
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Course category is required']
    },
    difficulty: {
        type: String,
        required: true,
        enum: ["Beginner", "Intermediate", "Advanced"]
    },
    language:{
        type : String,
        required : true,
        maxlength: 15
    },
    thumbnail: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        min: 0,
        default: 0
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
     createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    status: {
        type: String,
        enum: ["Draft", "Published"],
        default: "Published"
    },
    tags:{
        type : Array,
        required : true,
    },
    
})

const Course = mongoose.model('Course',courseSchema)

export default Course;