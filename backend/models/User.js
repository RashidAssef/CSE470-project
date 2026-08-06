import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema definition for the database.
 * Contains user credentials, roles, and status for access control.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      // We will dynamically assign this on document creation based on the role
    },
    phone: {
      type: String,
      default: '',
    },
    occupation: {
      type: String,
      default: '',
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      }
    ],
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

/**
 * Pre-save middleware hook.
 * 1. Hashes user passwords securely using bcrypt.
 * 2. Dynamically assigns default account status based on user role:
 *    - Instructors: default to 'pending' (requires admin verification)
 *    - Students & Admins: default to 'active'
 */
userSchema.pre('save', async function (next) {
  // 1. Handle Role-Based Default Status
  if (!this.status) {
    if (this.role === 'instructor') {
      this.status = 'pending';
    } else {
      this.status = 'active';
    }
  }

  // 2. Handle Password Hashing
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compares a plain text candidate password with the hashed password in database.
 * Used during user login authentication.
 * 
 * @instance
 * @method matchPassword
 * @param {string} enteredPassword - The plain text password from login form
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
