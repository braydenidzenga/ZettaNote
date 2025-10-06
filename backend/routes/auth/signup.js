import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { genToken } from '../../util/token.js';
import validatePass from '../../util/validatePass.js';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  // confirmPassword: z.string().min(1, 'Confirm password is required'),
});

export default async function signup(req) {
  try {
    if (!req.body) {
      return { resStatus: 400, resMessage: { message: 'Invalid request' } };
    }

    // Zod
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessage =
        parsed.error?.errors?.map((e) => e.message).join(', ') || 'Validation failed';
      return {
        resStatus: 400,
        resMessage: {
          message: errorMessage,
        },
      };
    }

    const { name, email, password } = parsed.data;

    // Password match check
    // if (password !== confirmPassword) {
    //   return { resStatus: 400, resMessage: { message: 'Passwords do not match' } };
    // }

    //validating password
    const validation = validatePass(password);
    if (validation.resStatus != 200) {
      return validation;
    }

    // Saving directly & rely on unique index
    const hashedPass = await bcrypt.hash(password, 10); // cost 10 for better speed
    const newUser = new User({ name, email, password: hashedPass });

    try {
      await newUser.save();
    } catch (err) {
      if (err.code === 11000) {
        // Mongo duplicate key error
        return { resStatus: 400, resMessage: { message: 'Email already in use' } };
      }
      throw err;
    }

    // Generate token
    const token = genToken(newUser);

    return {
      resStatus: 200,
      resMessage: { message: 'Signed up', newUser: { name: newUser.name, email: newUser.email, id: newUser._id } },
      token: token
    };
  } catch (err) {
    console.error(err);
    return { resStatus: 500, resMessage: { message: 'Internal server error' } };
  }
}
