// @ts-check

import { EventEmitter } from 'events'
import { spawn } from 'child_process'
import { readFileSync, watch,statSync } from 'fs'

// const 
let currentPid = 0

function runningBootstrap(bootstrap: string) {
    try {
        if (currentPid !== 0) {
            process.kill(currentPid, 9)
        } else {
            process.kill(currentPid, 0)
        }
    } catch (e) {
        console.log(e.message)
    }
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
    console.log("running", currentPid)
}

const watcher = []

function watcher1(paths) {
    for (const p of paths) {
        watcher.push(watch(p).on('change', (event,file) => {
            console.log(event, file)
            runningBootstrap(pwc.bootstrap)
        }))
    }
}

process.on('SIGILL', () => {
    watcher.forEach(w => w.close())
})

async function main() {
    watcher1(pwc.watch)
    runningBootstrap(pwc.bootstrap)

}

function readConfig() {
    const c = JSON.parse(readFileSync('process.json', { encoding: 'utf8' }))
    if (typeof c.watch === 'string') {
        c.watch = [c.watch]
    }
    return c as Config
}

function watchFilesChange(): boolean {
    let isChanged = false;
    for (const f of files) {
        const fileMtime = statSync(f).mtimeMs
        if (files[f] && files[f] === fileMtime) {
            continue
        } else {
            files[f] = fileMtime
            isChanged = true
        }
    }
    return isChanged
}

const pwc = readConfig()
const files :string[]= []
main()

while (true) {
    if (watchFilesChange(files)) {
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

interface Config {
    bootstrap: string
    watch: string[] | string
}

// console.log(getFiles('test', []))