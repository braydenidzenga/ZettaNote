import Page from '../../models/Page.model.js';
import User from '../../models/User.model.js';
import { verifyToken } from '../../util/token.js';
import { z } from 'zod';

export default async function sharePage(req) {
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

    // Zod validation for pageId, userEmail, and giveWritePermission only
    const sharePageSchema = z.object({
      pageId: z.string().min(1, 'Page ID is required'),
      userEmail: z.string().email('Invalid email address'),
      giveWritePermission: z.boolean().optional(),
    });
    const parseResult = sharePageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: 400,
        resMessage: {
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      };
    }
    const { pageId, userEmail, giveWritePermission } = parseResult.data;

    // verify user is logged in
    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: 400,
        resMessage: {
          Error: 'User not logged in',
        },
      };
    }

    // find page in db
    const page = await Page.findById(pageId);
    if (!page) {
      return {
        resStatus: 404,
        resMessage: {
          Error: 'Page not found',
        },
      };
    }

    // check user owns the page
    if (!page.owner.equals(user._id)) {
      return {
        resStatus: 403,
        resMessage: {
          message: 'Not authorized',
        },
      };
    }

    // find shared user account in db
    const sharedUser = await User.findOne({ email: userEmail });
    if (!sharedUser) {
      return {
        resStatus: 404,
        resMessage: { message: 'User does not exist' },
      };
    }

    // check if already shared
    let pageAlreadyShared = false;
    page.sharedTo.forEach((id) => {
      if (id.equals(sharedUser._id)) {
        pageAlreadyShared = true;
      }
    });

    if (pageAlreadyShared) {
      return {
        resStatus: 400,
        resMessage: {
          message: 'Page already shared with this page',
        },
      };
    }

    // add user to page.sharedTo and page.usersWithWritePermission if needed
    page.sharedTo.push(sharedUser._id);
    if (giveWritePermission) {
      page.usersWithWritePermission.push(sharedUser._id);
    }
    await page.save();

    // add page to user's sharedPages
    sharedUser.sharedPages.push(page._id);
    await sharedUser.save();

    return {
      resStatus: 200,
      resMessage: {
        message: 'Successfully shared with this user',
      },
    };
  } catch (err) {
    console.error(err);
    return {
      resStatus: 500,
      resMessage: {
        message: 'Internal server error',
      },
    };
  }
}
