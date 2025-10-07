import bcrypt from 'bcryptjs';
import User from '../../models/User.model.js';
import { genToken } from '../../util/token.js';
import validatePass from '../../util/validatePass.js';
import { z } from 'zod';

export default async function changePassword(req) {
  try {
    // Zod validation
    const changePasswordSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
      newPassword: z.string().min(1, 'New password is required'),
      confirmNewPassword: z.string().min(1, 'Confirm new password is required'),
    });
    const parseResult = changePasswordSchema.safeParse(req.body);
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
    const { email, password, newPassword, confirmNewPassword } = parseResult.data;
    //validating new password
    const validation = validatePass(newPassword);
    if (validation.resStatus != 200) {
      return validation;
    }

    // check if passwords match
    if (newPassword !== confirmNewPassword) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'Passwords do not match',
        },
      };
    }

    // check if user exists and is given the correct password
    const user = await User.findOne({ email: email });
    if (!user) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'Email or password invalid',
        },
      };
    }

    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'Email or password invalid',
        },
      };
    }

    // hash new password and save it to DB
    const newPassHashed = await bcrypt.hash(newPassword, 18);
    user.password = newPassHashed;
    await user.save();

    // gen token and return it to user
    const token = genToken(user);

    return {
      resStatus: 200,
      resMessage: {
        message: 'Password successfully changed',
        token: token,
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
