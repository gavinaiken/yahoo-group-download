const decode = require('unescape');

function transformMessage(msg) {
    if (!msg || typeof msg !== 'object' || !msg.ygData) {
        throw new Error(`Unknown msg object format`);
    }
    let obj = {
        from: decode(msg.ygData.from),
        authorName: decode(msg.ygData.authorName),
        postDate: new Date(Number(msg.ygData.postDate + '000')),
        subject: decode(msg.ygData.subject),
        rawEmail: decode(msg.ygData.rawEmail),
    };
    return obj;
}

module.exports = { transformMessage };
