import { spawn } from 'child_process'
import { readFileSync, watch, statSync, watchFile, readdirSync } from 'fs'

// const GlobalState = {
//     pid: 0,
//     files: [],
//     bootstrap: '',
// }

interface Configure {
    bootstrap: string
    watch: string[] | string
    interval: number
}

interface GlobalState {
    pid: number;
    files: string[];
    bootstrap: string;
    conf: Configure;
    filesMtime: { [file: string]: number }
}

function extractFiles(p: string, _files: string[] = []) {
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


function runningBootstrap(bootstrap: string): number {
    const daemon = spawn('node', [bootstrap]);
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
    })
    return daemon.pid
}

function readConfig(): Configure {
    const c = JSON.parse(readFileSync('process.json', { encoding: 'utf8' }))
    if (typeof c.watch === 'string') {
        c.watch = [c.watch]
    }
    return c as Configure
}

function watchStateChange(files: string[], state: { [file: string]: number }): boolean {
    const stateFiles = Object.keys(state)
    let isChanged = false;
    for (const f of stateFiles.filter(f => !files.includes(f))) {
        delete state[f]
        isChanged = true
    }
    return isChanged
}

function watchFilesChange(files: string[], state: { [file: string]: number }): boolean {
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
    const watcherState: { [file: string]: number } = {}
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
