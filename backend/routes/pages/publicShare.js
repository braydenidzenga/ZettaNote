import { v4 as uuidv4 } from 'uuid';
import Page from '../../models/Page.js';
import { verifyToken } from '../../util/token.js';

export async function publicShare(req) {
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

  // verify user is logged in
  const user = await verifyToken(token);
  if (!user) {
    return {
      resStatus: 401,
      resMessage: {
        message: 'User not logged in',
      },
    };
  }

  const { pageId } = req.body;
  console.log(pageId);
  const page = await Page.findById(pageId);

  if (!page) {
    return {
      resStatus: 404,
      resMessage: {
        Error: 'Page not found',
      },
    };
  }

  // Check if user owns the page
  if (!page.owner.equals(user._id)) {
    return {
      resStatus: 403,
      resMessage: {
        Error: 'Not authorized to share this page',
      },
    };
  }

  if (!page) {
    return {
      resStatus: 404,
      resMessage: {
        Error: 'Page not found',
      },
    };
  }
  console.log(page.publicShareId);
  if (page.publicShareId) {
    return {
      resStatus: 200,
      resMessage: {
        message: 'Already Shared',
        publicShareId: page.publicShareId,
      },
    };
  }

  const uniqueShareId = uuidv4();
  console.log(uniqueShareId);
  page.publicShareId = uniqueShareId;

  await page.save();

  return {
    resStatus: 200,
    resMessage: { message: 'Successfully Shared', publicShareId: page.publicShareId },
  };
}

export async function getPublicShare(shareId) {
  const page = await Page.findOne({ publicShareId: shareId });

  if (!page) {
    return {
      resStatus: 404,
      resMessage: {
        Error: 'Page not found',
      },
    };
  }

  return {
    resStatus: 200,
    resMessage: {
      title: page.pageName,
      content: page.pageData,
    },
  };
}
