/* This is modified for admin purposes. Among other things*/

import initScroller from './wrapper.js';
import responsiveCanvas from '../src/canvas.js';

const COLORS = config.colors;
const SIZE = config.size;

// For ios safari. This has to be done before the canvas is created
document.getElementById('canvas-container').style.height = `${window.innerHeight - 60}px`;

const displayCanvas = responsiveCanvas(1024, 1024, document.getElementById("canvas-container"));
displayCanvas.id = "canvas";
const displayCtx = displayCanvas.getContext("2d");
displayCtx.imageSmoothingEnabled = false;


// Canvas that is drawn on
const canvas = document.createElement('canvas');
canvas.width = canvas.height = SIZE;
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, SIZE, SIZE);

window.showModal = (elem, bool) => (typeof elem == "string" ? document.getElementById(elem) : elem).style.display = bool ? "block" : "none";

// For checking whether the mouse has moved
let dx = 0, dy = 0

let data = Array(SIZE).fill(0).map(() => Array(SIZE).fill(config.background));

const buttons = document.getElementById("buttons");
const timer = document.getElementById("timer");
const toggle = document.getElementById("toggle");
// WHYY, firefox
if(!toggle.checked) toggle.click();

let place = true;

let lastClick = 0, drawColor = 'black';


let ws;

let reflow = () => {
    document.getElementById('canvas-container').style.height = `${window.innerHeight - 60}px`;
    scroller.setDimensions(parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height), parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height));

    displayCanvas.resize();
}
window.addEventListener('resize', reflow);


let zoom = {
    left: 0, top: 0, zoom: 1
};


let updateDisplay = () => {
    displayCtx.clearRect(0, 0, 1024, 1024);
    let canvasSize = parseInt(displayCanvas.style.width);
    let left = zoom.left / zoom.z / (canvasSize / SIZE)
    let top = zoom.top / zoom.z / (canvasSize / SIZE)
    let size = SIZE / zoom.z

    displayCtx.drawImage(canvas, 
        left, top, size, size,
    0, 0, 1024, 1024);
}

let drawRect = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1)
    data[y][x] = COLORS.indexOf(color)
}

let render = (data) =>  {
    for (let y in data) {
        for(let x in data[y]) {
            drawRect(x, y, COLORS[data[y][x]]);
        }
    }
    updateDisplay();
}

let updatePos = () => {
    sessionStorage.setItem('pos', JSON.stringify({...zoom, drawColor}))
}

// Initialize Scroller
let scroller = initScroller(updateDisplay, x => {
    zoom = x;
    updatePos();
}, displayCanvas, document)

if (sessionStorage.getItem('pos')) {
    zoom = JSON.parse(sessionStorage.getItem('pos'));
    let {z, top, left, color} = zoom;
    drawColor = color;
    scroller.zoomTo(z);
    scroller.scrollTo(left, top);
}

// Dynamic button generation go brr
for (let color of COLORS) {
    const button = document.createElement("button");
    button.classList.add('color-button')
    button.style.backgroundColor = color;
    button.addEventListener("click", () => {
        drawColor = color;        
        for(let button of buttons.childNodes) {
            button.classList.remove('active')
        }
        button.classList.add('active')
    });
    buttons.appendChild(button);
}
buttons.childNodes[config.defaultSelected].click();

window.downloadPNG = () => {
    var link = document.createElement('a');
    link.download = `canvas.png`;
    link.href = canvas.toDataURL('png');
    link.click();
}

displayCanvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    if (displayCanvas.x < 1024 && displayCanvas.y > 0
        && displayCanvas.y < 1024 && displayCanvas.x > 0) {
        buttons.childNodes[data[y()][x()]].click();
    }
});

let getTruePos = (relative, offset) =>  (relative * SIZE / 1024 + offset / (parseInt(displayCanvas.style.width) / SIZE)) / zoom.z | 0

let x = () => getTruePos(displayCanvas.x, zoom.left);
let y = () => getTruePos(displayCanvas.y, zoom.top);

// These event listeners bubble in weird orders.
displayCanvas.addEventListener('pointerdown', (event) => {
    // We use clientX / clientY because it's a simple position check
    dx = event.clientX;
    dy = event.clientY;
})

displayCanvas.addEventListener('pointerup', (event) => {
    if (
        // Server handling
        (!config.server || (navigator.onLine && ws.readyState == 1)) &&
        // disabling    
        place
        // Within bounds
        && displayCanvas.x < 1024 && displayCanvas.y > 0
        && displayCanvas.y < 1024 && displayCanvas.x > 0
        // Mouse hasn't moved
        && (dx == event.clientX && dy == event.clientY 
            || (dy == 0 && dx == 0))
        // Not redrawing
        && data[y()][x()] != COLORS.indexOf(drawColor)
    ) {
        lastClick = Date.now();

        drawRect(x(), y(), drawColor);
        updateDisplay();
        ws.send(JSON.stringify({
            d: formatMessage(x(), y(), COLORS.indexOf(drawColor)).toString()
        }));
    }
})

let showCoords = () => {
    let clamp = pos => Math.min(Math.max(pos, 0), SIZE - 1);
    document.getElementById('coords').innerText = `(${clamp(x())}, ${clamp(y())})`;
}

window.addEventListener('pointerup', showCoords);
window.addEventListener('pointermove', showCoords);
window.addEventListener('pointerdown', showCoords);


window.addEventListener('keypress', () => {
    if (displayCanvas.keys.c) {
        toggle.click();
    }
})

toggle.addEventListener('click', () => {
    place = !place
})

var start_ws = () => {
    ws = new WebSocket(config.local ? "ws://localhost:8080" : "wss://canvas.rto.run/ws");
    ws.onopen = () => {}

    ws.onmessage = message => {
        JSON.parse(message.data).forEach((data) => {
            if ('d' in data) {
                var {x, y, color} = decodeMessage(data.d);
                drawRect(x, y, COLORS[color]);
                updateDisplay();
            }
            if ('r' in data) { // Only in first request
                render(decodeData(data.r));
                data = decodeData(data.r)
                document.getElementById('loader').style.display = 'none';
                return;
            }
        });
    }

    ws.onclose = () => {
        document.getElementById('loader').style.display = 'block';
        setTimeout(start_ws, 2000);
    }
}



if (config.server) {
    start_ws()
} else {
    // Avoid errors while doing nothing
    ws = {
        send(){}
    }
    document.getElementById('loader').style.display = 'none';
}