var r_ws = require("ws");
var {formatData, decodeMessage} = require("./data-utils");

var ws = new r_ws.Server({port: 8010});

const data = Array(128).fill(0).map(() => Array(128).fill(15));

let conns = [];

ws.on('connection', (conn) => {
    let lastMessage = 0;
    conn.send(formatData(data.flat()));
    console.log("New connection");
    conns.push(conn);
    conn.on('message', (message) => {
        if(Date.now() - lastMessage > 2500) {
            lastMessage = Date.now();
            const {x, y, color} = decodeMessage(parseInt(message));
            console.log('got me some data', x, y, color, message.toString());
            data[x][y] = color;
            for(let _conn of conns) {
                if(_conn != conn) _conn.send(message);
            }
        }
    })
    conn.on('close', () => {
        conns.splice(conns.indexOf(conn), 1);
        console.log('connection closed');
    })
})