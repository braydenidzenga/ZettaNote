import User from '../../models/User.js';
import { verifyToken } from '../../util/token.js';

export default async function getUser(req) {
  try {
    const token = req.cookies?.token;
    // console.log("Token in getUser:", token);
    if (!token) {
      return {
        resStatus: 401,
        resMessage: {
          message: 'No token, authorization denied',
        },
      };
    }

    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: 401,
        resMessage: {
          message: 'Token is not valid',
        },
      };
    }

    return {
      resStatus: 200,
      resMessage: {
        user: {
          name: user.name,
        },
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
