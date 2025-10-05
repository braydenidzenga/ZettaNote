import { v4 as uuidv4 } from "uuid";
import Page from "../../models/Page.js";

export async function publicShare(req) {

    const {pageId} = req.body
    console.log(pageId)
    const page = await Page.findById(pageId);

    if (!page) {
        return {
            resStatus: 404,
            resMessage: {
                    "Error": "Page not found"
            }
        }
    }
    console.log(page.publicShareId)
    if(page.publicShareId){
        return {
            resStatus: 200,
            resMessage: {
                    "message": "Already Shared",
                    "publicShareId" : page.publicShareId
            }
        }
    }
    
    
    const uniqueShareId = uuidv4();
    console.log(uniqueShareId);
    page.publicShareId = uniqueShareId

    await page.save();

    return {resStatus:200, resMessage:{"message":"Successfully Shared","publicShareId" : page.publicShareId}}
}

export async function getPublicShare(shareId){
    const page = await Page.findOne({ publicShareId: shareId });

    if (!page) {
        return {
            resStatus: 404,
            resMessage: {
                    "Error": "Page not found"
            }
        }
    }

    return {
        resStatus: 200, 
        resMessage: {
            title: page.pageName,
            content: page.pageData
        }
    }

}