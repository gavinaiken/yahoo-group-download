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

function messageCacheFile(group, num) {
    return path.join(messageCacheDir(group), num.toString());
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
