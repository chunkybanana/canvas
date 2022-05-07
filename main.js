let r_ws = require("ws");
const { program } = require('commander');
const fs = require('fs')
var {formatData, decodeMessage} = require("./front/data-utils");
let {port, size, delay, framesToSave, background} = require('./front/config');

let log, logs = [], data, savedata, backup;

program
    .option('-l, --log <file>', 'log file')
    .option('-b, --backup <file>', 'backup the canvas state to a file every minute')
    .option('-L, --load <file>', 'load the canvas state from a file')
    .option('-p, --port <port>','Websocket port', port)
    .option('-s, --stdout', 'log to stdout')
    .option('-e, --stderr', 'log to stderr')
    .action((options) => {
        if (options.backup) {
            backup = options.backup;
        }
        if (options.load) {
            data = JSON.parse(fs.readFileSync(options.load));
        }
        if (options.stdout) {
            log = console.log;
        } else if (options.stderr) {
            log = console.error;
        } else if (options.log) {
            log = options.log;
            // If it exists, clear it. If it doesn't exist, create it.
            if(!fs.existsSync(log)) fs.writeFileSync(log, "");
        }
        if (options.port) port = options.port;
    }) 
program.parse();

var ws = new r_ws.Server({ port });

data ||= Array(size).fill(0).map(() => Array(size).fill(background)) 

savedata = structuredClone(data);

let conns = [], ticks = [];

setInterval(() => {
    if (ticks.length)
    for (let conn of conns) {
        let otherticks = ticks
            .filter(([tick, con]) => con !== conn)
            .map(([tick]) => tick)
        let msg = JSON.stringify(otherticks);
        if (otherticks.length) conn.send(msg);
    }
    ticks = [];
}, 1000)

let constantTimeCompare = (a, b) => {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) diff++;
    }
    return diff === 0;
}

ws.on('connection', (conn, req) => {
    let conn_id = [...Array(12)].map(_ => (Math.random() * 16 | 0).toString(16)).join("");
    let lastMessage = 0;
    conn.send(JSON.stringify([{
        r: formatData(data),
        s: conns.length + 1
    }]));
    conn.ip = req.socket.remoteAddress
    conns.push(conn);
    ticks.push([{
        s: conns.length
    }, null]);
    conn.on('message', (message) => {
        let decoded;
        try {
            decoded = JSON.parse(message)
            if ('d' in decoded) {
                if(Date.now() - lastMessage > delay * 1000) {
                    lastMessage = Date.now();
                    // Apparently there was a bug here and I don't know how well it's been fixed.
                    if(!/\d+,\d+,\d+/.test(decoded.d)) return;
                    let {x, y, color} = decodeMessage(decoded.d.toString());
                    if(x < 0 || x >= size || y < 0 || y >= size) return;
                    if(!(color in config.colors)) return;
                    if (log) {
                        if(typeof log == "function") {
                            log(`${x} ${y} ${color} ${Date.now()} ${conn_id} `)

                            savedata[y][x] = color;
                        } else {
                            logs.push(`${x} ${y} ${color} ${Date.now()} ${conn_id} `);
                            if(logs.length >= framesToSave) {
                                fs.appendFileSync(log, logs.join("\n") + '\n');
                                // Only update the savedata when updating the data as well
                                for(let log of logs){
                                    let [x, y, color] = log.split` `.map(Number);
                                    savedata[y][x] = color;
                                }
                                logs = [];
                                fs.writeFileSync(backup, JSON.stringify(savedata));
                            }
                        }
                    }
                    data[y][x] = color;
                } 
                // This was a fun option but in the end it's just been annoying for slow connections.
                /* else if (Date.now() - lastMessage < delay * 2 / 5){
                    // Rickroll
                    conn.send(JSON.stringify({"e": "r"}))
                } */
                
            } // Add more support here
        } catch(e) {
            console.error(e)
        }

        // sent every 100ms
        ticks.push([JSON.parse(message.toString()), conn])
    })
    conn.on('close', () => {
        conns.splice(conns.indexOf(conn), 1);
        ticks.push([{
            s: conns.length
        }, null]);
    })
})

process.on("SIGINT", () => {
    if (log && typeof log != "function") {
        fs.appendFileSync(log, logs.join("\n") + '\n');

        for (let log of logs) {
            let [x, y, color] = log.split(" ").map(Number);
            savedata[y][x] = color;
        }

        logs = [];
    }

    fs.writeFileSync(backup || "sigint-" + Math.trunc(Math.random() * (2 ** 32)).toString(16).padStart(8, 0) + ".json", JSON.stringify(savedata));

    console.error("Saved logs and backup; o/");

    process.exit();
});
