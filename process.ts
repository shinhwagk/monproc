import { spawn } from 'child_process'
import { readdirSync, readFileSync, statSync } from 'fs'

let currentPid = 0

const fileCache: { [file: string]: number } = {}

function runningMain(bootstrap: string) {
    const daemon = spawn('node', [bootstrap]);
    currentPid = daemon.pid
    daemon.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    daemon.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    daemon.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

function checkFileChange(files: string[]): boolean {
    let isChanged = false;
    for (const f of files) {
        const fileMtime = statSync(f).mtimeMs
        if (fileCache[f] && fileCache[f] === fileMtime) {
            continue
        } else {
            fileCache[f] = fileMtime
            isChanged = true
        }
    }
    return isChanged
}

async function main() {
    const pwc = readConfig()
    const files = []
    for (const w of pwc.watch) {
        for (const f of getFiles(w)) {
            files.push(f)
        }
    }
    while (true) {
        if (checkFileChange(files)) {
            try {
                if (currentPid !== 0) {
                    process.kill(currentPid, 9)
                } else {
                    process.kill(currentPid, 0)
                }
            } catch (e) {
                console.log(e.message)
            }
            runningMain(pwc.main)
        }
        await new Promise(r => setTimeout(r, 1000));
        console.log("loop", currentPid)
    }
}

interface ProcessWatchConfig {
    main: string;
    watch: string[];
}

function getFiles(p: string, files_: string[] = []) {
    if (statSync(p).isDirectory()) {
        for (const i of readdirSync(p)) {
            const name = p + '/' + i;
            if (statSync(name).isFile()) {
                files_.push(name)
            } else {
                getFiles(name, files_);
            }
        }
    } else {
        files_.push(p)
    }
    return files_;
}

function readConfig(): ProcessWatchConfig {
    const c = JSON.parse(readFileSync('process.json', { encoding: 'utf8' }))
    if (typeof c.watch === 'string') {
        c.watch = [c.watch]
    }
    return c as ProcessWatchConfig
}

main()

// console.log(getFiles('test', []))