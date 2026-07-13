import User from '../models/User.js';
import Category from '../models/Category.js';
import Course from '../models/course.js';
/*
 [course_title,decription,category,difficulty,language,thumbnail_img,price
 instructor,createdAt,status, tags]
*/

export const getAllCourse =  async(req , res , next) => {
    try {
        const course = await Course.find({status:"Published"})
        if (course.length === 0){
            return res.status(200).json({
                courses: [],
                message:"No Courses availabe"
            })
        }
        res.send(course)
    }catch(err){
        next(err)
    }
}

export const insertCourse = async(req,res)=> {
    try {
        const instructorId = req.user._id;
        const category = await Category.findById(req.body.category);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }
    
        const course = new Course({
            course_title : req.body.course_title,
            description : req.body.description,
            category : category._id,
            difficulty : req.body.difficulty,
            language : req.body.language,
            thumbnail : req.body.thumbnail,
            price : req.body.price,
            instructor : req.user._id,
            tags : req.body.tags

        });
    
        await course.save();
        res.send(course);
    }catch(err){
        res.status(500).json({
            message: err.message});
    }

};


export const deleteCourse = async(req,res)=> {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                message: "course not found"
            });
        }
        
        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this course."
            });
        }
        
        
        await course.deleteOne();

        res.status(200).json({
            status: "success",
            message: "Course deleted successfully."
        });

    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
};


export const updateCourse = async (req, res) => {
    
    try{
        const course = await Course.findById(req.params.id);

        if(!course){

            return res.status(404).json({
                status:"fail",
                message:"Course not found"
            });

        }

        if(course.instructor.toString() !== req.user._id.toString()){

            return res.status(403).json({
                status:"fail",
                message:"You are not allowed to edit this course"
            });

        }

        // Update fields only if they are provided
        if (req.body.course_title !== undefined)
            course.course_title = req.body.course_title;

        if (req.body.description !== undefined)
            course.description = req.body.description;

        if (req.body.category !== undefined)
            course.category = req.body.category;

        if (req.body.difficulty !== undefined)
            course.difficulty = req.body.difficulty;

        if (req.body.language !== undefined)
            course.language = req.body.language;

        if (req.body.thumbnail !== undefined)
            course.thumbnail = req.body.thumbnail;
        
        if (req.body.status !== undefined)
            course.status = req.body.status;

        if (req.body.price !== undefined)
            course.price = req.body.price;

        if (req.body.tags !== undefined)
            course.tags = req.body.tags;

        const updatedCourse = await course.save();

        res.status(200).json({
            status: "success",
            message: "Course updated successfully.",
            course: updatedCourse
        });

    } catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
};