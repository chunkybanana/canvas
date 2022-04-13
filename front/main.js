const COLORS = ["#a31717","#fc0000","#fda500","#fed700","#c8f081","#29f222","#1aae00","#40e0d0","#1e90ff","#0800ff","#86019a","#ee46ee","#efc0cb","#000","#555","#ccc","#fff","#6a3d18","#fbdcbc","#1ebe72","#4466a1","#00408d","#7289da","#fd9aff"];

document.getElementById('canvas-container').style.height = `${window.innerHeight - 60}px`;

// Canvas that stuff is displayed on
// TODO: Adapt x and y to true coordinates relative to internal canvas
// I would make this canvas resizable but that's *more* work
const displayCanvas = responsiveCanvas(1024, 1024, document.getElementById("canvas-container"));
displayCanvas.id = "canvas";
const displayCtx = displayCanvas.getContext("2d");

// I got tired of toggling settings, so change these for local / serverless hosting
const LOCAL = false;
const SERVER = false;

const SIZE = 128;

// Canvas that is drawn on
const canvas = document.createElement('canvas');
canvas.width = canvas.height = SIZE;
const ctx = canvas.getContext("2d");
displayCtx.imageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;


ctx.fillStyle = "#ccc";
ctx.fillRect(0, 0, SIZE + 40, SIZE + 40);
ctx.fillStyle = "white";
ctx.fillRect(0, 0, SIZE, SIZE);

const buttons = document.getElementById("buttons");
const timer = document.getElementById("timer");

// Which iteration of the canvas are we on? 1-indexed + hardcoded.
const iteration = 2;

let stats = (localStorage.getItem("stats") || Array(iteration).fill(0).map(()=>({})))
    .map(v => COLORS.forEach(c => v[c] ||= 0) || v);

// Don't worry, ws is initialized later
var ws;

let lastClick = 0;
let drawColor = 'black';


let recievedData, playerCount;

let reflow = () => {
    document.getElementById('canvas-container').style.height = `${window.innerHeight - 60}px`;
    scroller.setDimensions(parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height), parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height));

}

let zoom = {
    left: 0, top: 0, zoom: 1
};

window.addEventListener('resize', reflow);

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


// Initialize Scroller
let scroller = new Scroller((left, top, z) => {
    zoom = {left, top, z};
    console.log(left, top, z);
    updateDisplay();
}, {
	zooming: true,
    bouncing: false,
    minZoom: 1,
    maxZoom: 2
});

scroller.setDimensions(parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height), parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height));

scroller.setPosition(
   (window.innerWidth - Math.min((window.innerHeight - 60), window.innerWidth)) / 2,
    (window.innerHeight - Math.min((window.innerHeight - 60), window.innerWidth) - 60) / 2
);


displayCanvas.addEventListener("touchstart", function(e) {
    // Don't react if initial down happens on a form element
    if (e.touches[0] && e.touches[0].target && e.touches[0].target.tagName.match(/input|textarea|select/i)) {
        return;
    }

    scroller.doTouchStart(e.touches, e.timeStamp);
    e.preventDefault();
}, false);

document.addEventListener("touchmove", function(e) {
    scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
}, false);

document.addEventListener("touchend", function(e) {
    scroller.doTouchEnd(e.timeStamp);
}, false);

document.addEventListener("touchcancel", function(e) {
    scroller.doTouchEnd(e.timeStamp);
}, false);

var mousedown = false;

displayCanvas.addEventListener("mousedown", function(e) {
    if (e.target.tagName.match(/input|textarea|select/i)) {
        return;
    }
    
    scroller.doTouchStart([{
        pageX: e.pageX,
        pageY: e.pageY
    }], e.timeStamp);

    mousedown = true;
}, false);

document.addEventListener("mousemove", function(e) {
    if (!mousedown) {
        return;
    }
    
    scroller.doTouchMove([{
        pageX: e.pageX,
        pageY: e.pageY
    }], e.timeStamp);

    mousedown = true;
}, false);

document.addEventListener("mouseup", function(e) {
    if (!mousedown) {
        return;
    }
    
    scroller.doTouchEnd(e.timeStamp);

    mousedown = false;
}, false);

displayCanvas.addEventListener("wheel", function(e) {
    scroller.doMouseZoom(e.detail ? (e.detail * -120) : e.wheelDelta, e.timeStamp, e.pageX, e.pageY);
}, false);

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
buttons.childNodes[13].click();

// WHYYY, mobile debugging
//alert(getComputedStyle(document.getElementById('canvas-container')).height + ' ' + window.innerHeight)

let startCountdown = () => {
    let time = Date.now() - lastClick;
    timer.style.display = "block";
    if (time > 2500) {
        timer.textContent = "";
        timer.style.display = "none";
        for(let button of buttons.childNodes) {
            button.disabled = false;
        }
        canvas.disabled = false;
        return;
    }
    timer.textContent = ((2500 - time) / 1000).toFixed(2);
    setTimeout(startCountdown, 20);
}

let showModal = (elem, bool) => {
    (typeof elem == 'string' ? document.getElementById(elem) : elem).style.display = bool ? "block" : "none";
}
// COMING SOON
let updateStats = () => {

}

let downloadPNG = () => {
    var link = document.createElement('a');
    link.download = `canvas.png`;
    link.href = canvas.toDataURL('png');
    link.click();
}

displayCanvas.addEventListener('pointerup', () => {
    if (
        (!SERVER || (navigator.onLine && ws.readyState == 1))
        && Date.now() - lastClick > 2500 
        && displayCanvas.x < 1024 && displayCanvas.y > 0 && displayCanvas.y < 1024 && displayCanvas.x > 0
    ) {
        lastClick = Date.now();
        let canvasSize = parseInt(displayCanvas.style.width);
        var x = Math.floor((displayCanvas.x / 8 + zoom.left / (canvasSize / SIZE)) / zoom.z), y = Math.floor((displayCanvas.y / 8 + zoom.top / (canvasSize / SIZE)) / zoom.z);
        startCountdown();
        for(let button of buttons.childNodes) {
            button.disabled = true;
            displayCanvas.disabled = true;
        }
        drawRect(x, y, drawColor);
        updateDisplay();
        stats[iteration - 1][drawColor]++;
        ws.send(JSON.stringify({
            d: formatMessage(x, y, COLORS.indexOf(drawColor)).toString()
        }));
    }
})

let drawRect = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1)
}

let render = (data) =>  {
    for (let y in data) {
        for(let x in data[y]) {
            drawRect(x, y, COLORS[data[y][x]]);
        }
    }
    updateDisplay();
}

updateCount = () => document.getElementById('player-count').innerText = playerCount;

var start_ws = () => {
    ws = new WebSocket(LOCAL ? "ws://localhost:8080" : "wss://canvas.rto.run/ws");
    ws.onopen = () => {
        recievedData = false;
    }

    ws.onmessage = message => {
        ((data) => {
            if ('d' in data) {
                var {x, y, color} = decodeMessage(parseInt(data.d))
                drawRect(x, y, COLORS[color]);
            }
            if ('s' in data) {
                playerCount = data.s;
                updateCount();
            }
            if ('r' in data) { // Only in first request
                render(decodeData(data.r));
                playerCount = data.s;
                updateCount();
                document.getElementById('player-icon').style.display = 'block';
                document.getElementById('player-count').style.display = 'block';
                document.getElementById('loader').style.display = 'none';
                return;
            }
        })(JSON.parse(message.data));
    }

    ws.onclose = () => {
        document.getElementById('player-icon').style.display = 'none';
        document.getElementById('player-count').style.display = 'none';
        document.getElementById('loader').style.display = 'block';
        setTimeout(start_ws, 2000);
    }
}

if (SERVER) {
    start_ws()
} else {
    // Avoid errors while doing nothing
    ws = {
        send(){}
    }
    document.getElementById('player-icon').style.display = 'block';
    document.getElementById('player-count').style.display = 'block';
    document.getElementById('loader').style.display = 'none';
}