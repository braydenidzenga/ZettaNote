import Page from '../../models/Page.js';
import { verifyToken } from '../../util/token.js';
import { z } from 'zod';

export default async function createPage(req) {
  try {
    // Zod validation
    const createPageSchema = z.object({
      pageName: z.string().min(1, 'Page name is required'),
      token: z.string().min(1, 'Token is required'),
    });
    const parseResult = createPageSchema.safeParse(req.body);
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
    const { pageName, token } = parseResult.data;

    // validate user token
    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'User not logged in',
        },
      };
    }

    // create new page and save to db
    const newPage = new Page({
      pageName: pageName,
      pageData: ' ',
      owner: user._id,
    });
    await newPage.save();

    // add page id to user list of page ids
    user.pages.push(newPage._id);
    await user.save();

    // return the new page to the user
    return {
      resStatus: 200,
      resMessage: {
        message: 'Page created',
        Page: newPage,
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
