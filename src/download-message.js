const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const readdirAsync = promisify(fs.readdir);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const request = require('request-promise');

const debug = new require('debug')('download-message');

const cookieFile = 'session.cookie';
const cacheDirName = 'messagecache';
const parentDir = path.join(__dirname, '..');

var cookiejar;

function cacheDir() {
    return path.join(parentDir, cacheDirName);
}

function messageCacheDir(group) {
    return path.join(cacheDir(), group);
}

async function messageCacheFile(group, num) {
    let thousands = Math.floor(num / 1000).toString();
    let topCacheDir = messageCacheDir(group);
    let msgCacheDir = path.join(topCacheDir, thousands);
    let cacheDirContents = await readdirAsync(topCacheDir);
    if (!cacheDirContents.includes(thousands)) {
        await mkdirAsync(msgCacheDir);
    }
    return path.join(msgCacheDir, num.toString());
}

async function mkCacheDir(group) {
    let parentDirContents = await readdirAsync(parentDir);
    if (!parentDirContents.includes(cookieFile)) {
        console.error(`Please set up the cookie file "${cookieFile}" before downloading any messages`);
        process.exit(1);
    }
    let cacheDirPath = cacheDir();
    if (!parentDirContents.includes(cacheDirName)) {
        await mkdirAsync(cacheDirPath);
    }
    let cacheDirContents = await readdirAsync(cacheDirPath);
    if (!cacheDirContents.includes(group)) {
        let messageCacheDirPath = messageCacheDir(group);
        await mkdirAsync(messageCacheDirPath);
    }
}

async function setupCookies() {
    let cookiejar = request.jar();
    let sessionCookie = await readFileAsync(cookieFile);
    let sessionCookies = sessionCookie
        .toString()
        .replace(/^cookie: /, '')
        .replace(/^\s/g, '')
        .replace(/\s$/g, '')
        .split('; ');

    sessionCookies.forEach(cookie => {
        cookiejar.setCookie(cookie, 'https://groups.yahoo.com');
    });

    return cookiejar;
}

async function downloadMessage(group, num) {
    await mkCacheDir(group);
    let msgFile = await messageCacheFile(group, num);

    try {
        let message = await readFileAsync(msgFile, 'utf8');
        debug('returning cached message');
        debug('message is:\n', message);
        return JSON.parse(message);
    } catch (e) {
        // do nothing
    }

    if (!cookiejar) {
        cookiejar = await setupCookies();
    }

    let options = {
        uri: `https://groups.yahoo.com/api/v1/groups/${group}/messages/${num}/raw`,
        jar: cookiejar
    };

    let message = await request(options);
    debug(`returning message fetched from ${options.uri}`);
    message = message.replace(/\s$/g, '');
    await writeFileAsync(msgFile, message);
    debug('message is:\n', message);
    return JSON.parse(message);
}

module.exports = { downloadMessage, messageCacheDir };
