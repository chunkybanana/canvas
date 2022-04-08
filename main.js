var r_ws = require("ws");
const { program } = require('commander');
const fs = require('fs')
var {formatData, decodeMessage} = require("./front/data-utils");

let port = 8080;
let log, logs = [], data;



program
    .option('-l, --log <file>', 'log file')
    .option('-b, --backup <file>', 'backup the canvas state to a file every minute')
    .option('-L, --load <file>', 'load the canvas state from a file')
    .option('-p, --port <port>','Websocket port', 8080)
    .option('-s, --stdout', 'log to stdout')
    .option('-e, --stderr', 'log to stderr')
    .action((options) => {
        if (options.backup) {
            setInterval(() => {
                fs.writeFileSync(options.backup, JSON.stringify(data));
            }, 60000)
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
            fs.writeFileSync(log, "");
        }
        if (options.port) port = options.port;
    }) 
program.parse();

var ws = new r_ws.Server({port: port});

data ||= Array(128).fill(0).map(() => Array(128).fill(16)) 

let conns = [];


ws.on('connection', (conn) => {
    let lastMessage = 0;
    conn.send(formatData(data));
    conns.push(conn);
    conn.on('message', (message) => {
        let decoded = JSON.parse(message)
        if ('d' in decoded && Date.now() - lastMessage > 2500) {
            lastMessage = Date.now();
            const {x, y, color} = decodeMessage(parseInt(decoded.d));
            if (log) {
                if(typeof log == "function") {
                    log(`${x} ${y} ${color} ${Date.now()} `)
                } else {
                    logs.push(`${x} ${y} ${color} ${Date.now()} `);
                    console.log(logs)
                    if(logs.length > 100) {
                        fs.appendFileSync(log, logs.join("\n") + '\n');
                        logs = [];
                    }
                }
            }
            data[y][x] = color;
        } // Add more support here
        
        // Eventually we should turn this into a tick-based event loop
        // But for now, just propagate it.
        for (let _conn of conns) {
            if (_conn != conn) _conn.send(message);
        }
    })
    conn.on('close', () => {
        conns.splice(conns.indexOf(conn), 1);
    })
})
