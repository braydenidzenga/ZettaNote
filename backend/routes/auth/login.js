import bcrypt from 'bcryptjs';
import { genToken } from '../../util/token.js';
import User from '../../models/User.js';
import validatePass from '../../util/validatePass.js';
import { z } from 'zod';

export default async function login(req) {
  try {
    if (!req.body || !req.body.email || !req.body.password) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'Email and Password are required',
        },
      };
    }
    const { email, password } = req.body;

    const loginSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    });
    const parseResult = loginSchema.safeParse(req.body);
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

    // check if email is in db
    const user = await User.findOne({ email: email });
    if (!user) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'Invalid email or password',
        },
      };
    }
    //validating password
    const validation = validatePass(password);
    if (validation.resStatus != 200) {
      return validation;
    }

    // match password to password in DB
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'Invalid email or password',
        },
      };
    }

    // gen token and return to user
    const token = genToken(user);
    return {
      resStatus: 200,
      resMessage: {
        message: 'Logged in',
        user: { name: user.name, email: user.email, id: user._id }
      },
      token: token
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
