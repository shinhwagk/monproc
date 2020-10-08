"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
function extractFiles(p, _files = []) {
    if (fs_1.statSync(p).isDirectory()) {
        for (const i of fs_1.readdirSync(p)) {
            const name = p + '/' + i;
            if (fs_1.statSync(name).isFile()) {
                _files.push(name);
            }
            else {
                extractFiles(name, _files);
            }
        }
    }
    else {
        _files.push(p);
    }
    return _files;
}
function runningBootstrap(bootstrap) {
    const daemon = child_process_1.spawn('node', [bootstrap]);
    daemon.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    daemon.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    daemon.on('close', (code) => {
        console.log(`child process close with code ${code}`);
    });
    daemon.on('exit', (code, signal) => {
        console.log(`child process exited with code ${code} ${signal}`);
    });
    return daemon.pid;
}
function readConfig() {
    const c = JSON.parse(fs_1.readFileSync('process.json', { encoding: 'utf8' }));
    if (typeof c.watch === 'string') {
        c.watch = [c.watch];
    }
    return c;
}
function watchStateChange(files, state) {
    const stateFiles = Object.keys(state);
    let isChanged = false;
    for (const f of stateFiles.filter(f => !files.includes(f))) {
        delete state[f];
        isChanged = true;
    }
    return isChanged;
}
function watchFilesChange(files, state) {
    let isChanged = false;
    for (const file of files) {
        const currMtime = fs_1.statSync(file).mtimeMs;
        const prevMtime = state[file];
        if (currMtime === prevMtime) {
            continue;
        }
        else {
            state[file] = currMtime;
            isChanged = true;
        }
    }
    return isChanged;
}
async function main() {
    const conf = readConfig();
    if (typeof conf.watch === 'string') {
        conf.watch = [conf.watch];
    }
    conf.watch = conf.watch.concat(conf.bootstrap);
    const watcherState = {};
    const runningState = { pid: 0 };
    while (true) {
        const watcherFiles = extractFiles(conf.watch[0], []);
        if (watchStateChange(watcherFiles, watcherState) || watchFilesChange(watcherFiles, watcherState)) {
            try {
                if (runningState.pid !== 0) {
                    process.kill(runningState.pid, 9);
                }
                else {
                    process.kill(runningState.pid, 0);
                }
            }
            catch (e) {
                console.log(e.message);
            }
            runningState.pid = runningBootstrap(conf.bootstrap);
        }
        await new Promise(res => setTimeout(res, conf.interval));
    }
}
main();
