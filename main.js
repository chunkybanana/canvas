var r_ws = require("ws");
var {formatData, decodeMessage} = require("./data-utils");

var ws = new r_ws.Server({port: 8011});

const raw = JSON.parse(require("fs").readFileSync("canvas.json", "utf-8"));
const data = raw; // Array(128).fill(0).map(() => Array(128).fill(0).map(_ => raw.shift()));

let conns = [];

ws.on('connection', (conn) => {
    let lastMessage = 0;
    conn.send(formatData(data.flat()));
    // console.log("New connection");
    conns.push(conn);
    conn.on('message', (message) => {
        if(Date.now() - lastMessage > 2250) {
            lastMessage = Date.now();
            const {x, y, color} = decodeMessage(parseInt(message));
            console.log(x + " " + y + " " + color + " " + Date.now());
            data[x][y] = color;
            for(let _conn of conns) {
                if(_conn != conn) _conn.send(message);
            }
        }
    })
    conn.on('close', () => {
        conns.splice(conns.indexOf(conn), 1);
        // console.log('connection closed');
    })
})
