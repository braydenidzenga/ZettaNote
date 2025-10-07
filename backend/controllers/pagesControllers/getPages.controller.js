import Page from '../../models/Page.model.js';
import { verifyToken } from '../../util/token.js';
import { z } from 'zod';

export async function getPage(req) {
  try {
    // Get token from cookies and pageId from request body
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: 401,
        resMessage: {
          message: 'No token, authorization denied',
        },
      };
    }

    // Zod validation for pageId only
    const getPageSchema = z.object({
      pageId: z.string().min(1, 'Page ID is required'),
    });
    const parseResult = getPageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: 400,
        resMessage: {
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      };
    }
    const { pageId } = parseResult.data;

    // verify user token
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

    // check if user has access to the page
    let permission = false;

    if (page.owner.equals(user._id)) {
      permission = true;
    }

    page.sharedTo.forEach((id) => {
      if (id.equals(user._id)) {
        permission = true;
      }
    });

    if (!permission) {
      return {
        resStatus: 403,
        resMessage: {
          Error: 'Not authorized',
        },
      };
    }

    // return page to user
    return {
      resStatus: 200,
      resMessage: {
        Page: page,
      },
    };
  } catch (err) {
    console.log(err);
    return {
      resStatus: 500,
      resMessage: {
        Error: 'Internal server error',
      },
    };
  }
}

// returns a list of the users page names and ids
export async function getPages(req) {
  try {
    // Get token from cookies instead of request body
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
        resStatus: 400,
        resMessage: {
          message: 'User not logged in',
        },
      };
    }

    // get owned pages
    let ownedPages = [];
    for (const id of user.pages) {
      const page = await getPageNameAndId(id);
      if (page !== null) {
        ownedPages.push(page);
      }
    }

    // get shared pages
    let sharedPages = [];
    for (const id of user.sharedPages) {
      const page = await getPageNameAndId(id);
      if (page !== null) {
        sharedPages.push(page);
      }
    }

    return {
      resStatus: 200,
      resMessage: {
        OwnedPages: ownedPages,
        SharedPages: sharedPages,
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

// returns the name and the id of the page as a object
async function getPageNameAndId(pageId) {
  const page = await Page.findById(pageId);

  if (!page) {
    return null;
  }

  return {
    name: page.pageName,
    id: page._id,
  };
}
