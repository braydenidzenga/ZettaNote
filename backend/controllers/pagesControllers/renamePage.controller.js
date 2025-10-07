import Page from '../../models/Page.model.js';
import { verifyToken } from '../../util/token.js';
import { z } from 'zod';

export default async function renamePage(req) {
  try {
    // Get token from cookies
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: 401,
        resMessage: {
          message: 'No token, authorization denied',
        },
      };
    }

    // Zod validation for pageId and newPageName only
    const renamePageSchema = z.object({
      pageId: z.string().min(1, 'Page ID is required'),
      newPageName: z.string().min(1, 'New page name is required'),
    });
    const parseResult = renamePageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: 400,
        resMessage: {
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      };
    }
    const { pageId, newPageName } = parseResult.data;

    // verify user and find page in DB
    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'User not logged in',
        },
      };
    }

    const page = await Page.findById(pageId);
    if (!page) {
      return {
        resStatus: 404,
        resMessage: {
          message: 'Page not found',
        },
      };
    }

    // checks if user is the owner of the page
    if (!page.owner.equals(user._id)) {
      return {
        resStatus: 403,
        resMessage: {
          message: 'Not authorized',
        },
      };
    }

    // change the page name and save to DB
    page.pageName = newPageName;
    await page.save();

    // return new page to user
    return {
      resStatus: 200,
      resMessage: {
        'Updated Page': page,
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
