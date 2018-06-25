const fs = require('fs');
const path = require('path');

const moment = require('moment');
const debug = new require('debug')('append-mbox');

const parentDir = path.join(__dirname, '..');
const mBoxDir = 'mbox';

var mbox;

function openStream(group) {
    let parentDirContents = fs.readdirSync(parentDir);
    if (!parentDirContents.includes(mBoxDir)) {
        fs.mkdirSync(path.join(parentDir, mBoxDir));
    }
    let mboxPath = path.join(parentDir, mBoxDir, group);
    mbox = fs.createWriteStream(mboxPath, {flags: 'a'});
}

function appendMbox(group, msg) {
    if (!mbox) {
        openStream(group);
    }
    let fromMoment = moment(msg.postDate);
    let day = fromMoment.format('D');
    if (day.length === 1) {
        day = ' ' + day;
    }
    let fromDate = fromMoment.format(' ddd MMM ') + day + fromMoment.format(' HH:mm:ss YYYY');
    mbox.write('From ' + msg.from + fromDate + '\n');
    mbox.write(msg.rawEmail + '\n');
}

function closeMbox() {
    if (mbox) {
        mbox.end();
        mbox = null;
    }
}

module.exports = { appendMbox, closeMbox };
