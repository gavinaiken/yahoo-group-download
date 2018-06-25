const fs = require('fs');

const { downloadMessage } = require('./download-message');
const { transformMessage } = require('./transform-message');
const { appendMbox, closeMbox } = require('./append-mbox');

const maxPerSession = 10000;
const nextIndexFileBase = './nextIndex';

function nextIndexFile(group) {
    return `${nextIndexFileBase}-${group}`;
}

async function continueDownloadFromIndex(group, idx, numToDownload) {
    let count = 0;
    while (count < numToDownload) {
        let ymsg;
        try {
            ymsg = await downloadMessage(group, idx);
        } catch (err) {
            if (err.statusCode === 404) {
                console.log('Reached last message id', idx--);
            } else {
                console.error(err.message);
            }
            break;
        }

        let msg = transformMessage(ymsg);
        console.log(`Downloaded msg ${idx} from ${msg.from}`);
        // console.log(msg.authorName);
        // console.log(msg.postDate);
        // console.log(msg.subject);
        // console.log(msg.rawEmail);
        appendMbox(group, msg);
        count++;
        idx++;
        fs.writeFileSync(nextIndexFile(group), idx.toString());
    }
}

/**
 * Download messages from the group.
 * @param  {String} group                 Name of the yahoo group to download messages from
 * @param  {Number} options.startAt       If startAt is specified, begin downloading from that message number,
 *                                        otherwise begin where we last left off, or message 1.
 * @param  {Number} options.numToDownload Max number of messages to download, defaults to 10000.
 * @return {Promise}                      Resolves when done.
 */
function download(group, {startAt = null, numToDownload = maxPerSession} = {}) {
    if (!startAt) {
        startAt = 1;
        try {
            startAt = fs.readFileSync(nextIndexFile(group), 'utf8');
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.log(err);
                process.exit(1);
            }
        }
    }

    continueDownloadFromIndex(group, startAt, numToDownload)
        .catch(err => {
            console.error(err);
        })
        .then(() => {
            closeMbox();
        });
}

module.exports = { download };
