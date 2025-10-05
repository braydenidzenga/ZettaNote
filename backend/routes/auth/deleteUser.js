import { z } from 'zod';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';

export default async function deleteUser(req) {
  try {
    // Zod validation
    const deleteUserSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    });
    const parseResult = deleteUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: 400,
        resMessage: {
          message: JSON.parse(parseResult.error)
            .map((err) => err.message)
            .join(', '),
        },
      };
    }

    const { email, password } = parseResult.data;
    // check if user exists and is given the correct password
    const user = await User.findOne({ email: email });
    if (!user) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'User Not Exist',
        },
      };
    }

    const passMatch = await bcrypt.compare(password.trim(), user.password);

    if (!passMatch) {
      return {
        resStatus: 400,
        resMessage: {
          message: "password Doesn't Match",
        },
      };
    }

    await user.deleteOne();

    return {
      resStatus: 200,
      resMessage: {
        message: 'Account deleted Succesfully',
      },
    };
  } catch (err) {
    console.log(err);
    return {
      resStatus: 500,
      resMessage: {
        message: 'Internal server error',
      },
    };
  }
}
