const { spawn } = require('child_process')
const { readFileSync, statSync, readdirSync } = require('fs')
const { format } = require('util')

function extractFiles(p, _files = []) {
    if (statSync(p).isDirectory()) {
        for (const i of readdirSync(p)) {
            const name = p + '/' + i;
            if (statSync(name).isFile()) {
                _files.push(name)
            } else {
                extractFiles(name, _files);
            }
        }
    } else {
        _files.push(p)
    }
    return _files;
}

function runningBootstrap(bootstrap) {
    const daemon = spawn('node', [bootstrap]);
    daemon.stdout.on('data', (data) => {
        // console.log(`stdout: ${data}`);
        process.stdout.write(format('\x1b[32mstderr\x1b[0m: \x1b[36m%s\x1b[0m', data));
    });
    daemon.stderr.on('data', (data) => {
        process.stdout.write(format('\x1b[32mstderr\x1b[0m: \x1b[31m%s\x1b[0m', data));
    });
    daemon.on('exit', (code, signal) => {
        process.stdout.write(format('\x1b[32mexit\x1b[0m: \x1b[33m%s,%s\x1b[0m', code, signal));
    })
    return daemon.pid
}

function readConfig() {
    const c = JSON.parse(readFileSync('.monproc.json', { encoding: 'utf8' }))
    if (typeof c.watch === 'string') {
        c.watch = [c.watch]
    }
    return c
}

function watchStateChange(files, state) {
    const stateFiles = Object.keys(state)
    let isChanged = false;
    for (const f of stateFiles.filter(f => !files.includes(f))) {
        delete state[f]
        isChanged = true
    }
    return isChanged
}

function watchFilesChange(files, state) {
    let isChanged = false;
    for (const file of files) {
        const currMtime = statSync(file).mtimeMs
        const prevMtime = state[file]
        if (currMtime === prevMtime) {
            continue
        } else {
            state[file] = currMtime
            isChanged = true
        }
    }
    return isChanged
}

async function main() {
    const conf = readConfig()
    if (typeof conf.watch === 'string') {
        conf.watch = [conf.watch]
    }
    conf.watch = conf.watch.concat(conf.bootstrap)
    const watcherState = {}
    const runningState = { pid: 0 }

    while (true) {
        const watcherFiles = extractFiles(conf.watch[0], [])
        if (watchStateChange(watcherFiles, watcherState) || watchFilesChange(watcherFiles, watcherState)) {
            try {
                if (runningState.pid !== 0) {
                    process.kill(runningState.pid, 9)
                } else {
                    process.kill(runningState.pid, 0)
                }
            } catch (e) {
                console.log(e.message)
            }
            runningState.pid = runningBootstrap(conf.bootstrap)
        }
        await new Promise(res => setTimeout(res, conf.interval));
    }
}

main()
