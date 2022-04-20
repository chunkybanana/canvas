let r_ws = require("ws");
const { program } = require('commander');
const fs = require('fs')
var {formatData, decodeMessage} = require("./front/data-utils");
let {port, size, delay, framesToSave} = require('./front/config');

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

data ||= Array(size).fill(0).map(() => Array(size).fill(16)) 

savedata = structuredClone(data);

let conns = [];

ws.on('connection', (conn) => {
    let lastMessage = 0;
    conn.send(JSON.stringify({
        r: formatData(data),
        s: conns.length + 1
    }));
    conns.push(conn);
    for (let _conn of conns) {
        _conn.send(JSON.stringify({
            s: conns.length
        }));
    }
    conn.on('message', (message) => {
        let decoded;
        try {
            decoded = JSON.parse(message)
            if ('d' in decoded) {
                if(Date.now() - lastMessage > delay * 1000) {
                    lastMessage = Date.now();
                    let {x, y, color} = decodeMessage(decoded.d.toString());
                    if (log) {
                        if(typeof log == "function") {
                            log(`${x} ${y} ${color} ${Date.now()} `)
                        } else {
                            logs.push(`${x} ${y} ${color} ${Date.now()} `);
                            if(logs.length >= config.framesToSave) {
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
        // Eventually we should turn this into a tick-based event loop
        // But for now, just propagate it.
        for (let _conn of conns) {
            if (_conn != conn) _conn.send(message.toString());
        }
    })
    conn.on('close', () => {
        conns.splice(conns.indexOf(conn), 1);
        for (let _conn of conns) {
            _conn.send(JSON.stringify({
                s: conns.length
            }));
        }
    })
})