import mongoose from 'mongoose';

const PageSchema = new mongoose.Schema({
    pageName: {
        type: String,
        required: true
    },
    pageData: {
        type: String,
        required: true,
        default: ""
    },
    owner: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    sharedTo: {
      type: [mongoose.Types.ObjectId],
      required: true,
      default: []
    },
    usersWithWritePermission: {
        type: [mongoose.Types.ObjectId],
        required: true,
        default: []
    },
    publicShareId:{
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now()
    }
});

export default new mongoose.model('Page', PageSchema);
