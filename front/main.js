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
const SERVER = true;

const SIZE = 128;

// Canvas that is drawn on
const canvas = document.createElement('canvas');
canvas.width = canvas.height = SIZE;
const ctx = canvas.getContext("2d");
displayCtx.imageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

let data = Array(SIZE).fill(0).map(() => Array(SIZE).fill(16));

// For checking whether the mouse has moved
let dx = 0, dy = 0


ctx.fillStyle = "#ccc";
ctx.fillRect(0, 0, SIZE + 40, SIZE + 40);
ctx.fillStyle = "white";
ctx.fillRect(0, 0, SIZE, SIZE);

const buttons = document.getElementById("buttons");
const timer = document.getElementById("timer");
const toggle = document.getElementById("toggle");
// WHYY, firefox
if(!toggle.checked) toggle.click();
let place = true;

// Which iteration of the canvas are we on? 1-indexed + hardcoded.
const iteration = 2;
let stats;
try {
    stats = (JSON.parse(localStorage.getItem("stats")) || Array(iteration).fill(0).map(()=>({})))
    .map(v => COLORS.forEach(c => v[c] ||= 0) || v);
} catch(e){
    console.error(e)
    console.log('Stats not found');
}
// Don't worry, ws is initialized later
var ws;

let lastClick = 0;
let drawColor = 'black';


let recievedData, playerCount;

let reflow = () => {
    document.getElementById('canvas-container').style.height = `${window.innerHeight - 60}px`;
    scroller.setDimensions(parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height), parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height));

    displayCanvas.resize();
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


// Initialize Scroller
let scroller = new Scroller((left, top, z) => {
    zoom = {left, top, z};
    updateDisplay();
}, {
	zooming: true,
    bouncing: false,
    minZoom: 1,
    // Placing tiny pixels on mobile is *hard*.
    maxZoom: 12,
});

scroller.setDimensions(parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height), parseInt(displayCanvas.style.width), parseInt(displayCanvas.style.height));

scroller.setPosition(
   (window.innerWidth - Math.min((window.innerHeight - 60), window.innerWidth)) / 2,
    (window.innerHeight - Math.min((window.innerHeight - 60), window.innerWidth) - 60) / 2
);

handleScroller(displayCanvas, document, scroller, updateDisplay)

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

let updateStats = () => {
    let placedPixels = document.getElementById("placed-pixels");
    let totalPixels = document.getElementById("total-pixels");

    placedPixels.innerText = Object.values(stats[iteration - 1]).reduce((a, b) => a + b, 0)
    totalPixels.innerText = stats.flatMap(stat => Object.values(stats[iteration - 1])).reduce((a, b) => a + b, 0)

    let colourCounts = {};
    for (let color of COLORS) {
        for (let stat of stats) {
            colourCounts[color] = (colourCounts[color] || 0) + stat[color];
        }
    }

    let sortedColours = Object.entries(colourCounts).sort((a, b) => b[1] - a[1]);
    let topColours = sortedColours.slice(0, 5);
    
    let topColour = document.getElementById("favorite-colors");

    topColour.innerHTML = "";

    for (let [color, count] of topColours) {
        let li = document.createElement("li");
        let span = document.createElement("span");
        span.style.backgroundColor = color;
        span.style.color = "#888";
        span.innerHTML = `&nbsp;`.repeat(5);
        li.appendChild(span);

        let text = document.createElement("span");
        text.innerHTML = `&times;${count}`;
        li.appendChild(text);

        topColour.appendChild(li);
    }

    localStorage.setItem("stats", JSON.stringify(stats));
}

let downloadPNG = () => {
    var link = document.createElement('a');
    link.download = `canvas.png`;
    link.href = canvas.toDataURL('png');
    link.click();
}

// These event listeners bubble in weird orders.
displayCanvas.addEventListener('pointerdown', (event) => {
    // We use clientX / clientY because it's a simple position check
    dx = event.clientX;
    dy = event.clientY;
})

displayCanvas.addEventListener('pointerup', (event) => {

    let canvasSize = parseInt(displayCanvas.style.width);
    let s = (canvasSize / SIZE);
    let x = Math.floor((displayCanvas.x / 8 + zoom.left / s) / zoom.z), 
        y = Math.floor((displayCanvas.y / 8 + zoom.top / s) / zoom.z);
    if (
        // Server handling
        (!SERVER || (navigator.onLine && ws.readyState == 1)) &&
        // Timing and disabling    
        place && Date.now() - lastClick > 2500 
        // Within bounds
        && displayCanvas.x < 1024 && displayCanvas.y > 0
        && displayCanvas.y < 1024 && displayCanvas.x > 0
        // Mouse hasn't moved
        && (dx == event.clientX && dy == event.clientY 
            || (dy == 0 && dx == 0))
        // Not redrawing
        && data[y][x] != COLORS.indexOf(drawColor)
    ) {
        lastClick = Date.now();

        startCountdown();
        for(let button of buttons.childNodes) {
            button.disabled = true;
            displayCanvas.disabled = true;
        }
        drawRect(x, y, drawColor);
        updateDisplay();
        stats[iteration - 1][drawColor]++;
        updateStats();
        ws.send(JSON.stringify({
            d: formatMessage(x, y, COLORS.indexOf(drawColor)).toString()
        }));
    }
})


window.addEventListener('keypress', () => {
    console.log(displayCanvas.keys)
    if (displayCanvas.keys.c) {
        toggle.click();
    }
})

toggle.addEventListener('click', () => {
    place = !place
})

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
                updateDisplay();
            }
            if ('s' in data) {
                playerCount = data.s;
                updateCount();
            }
            if ('r' in data) { // Only in first request
                render(decodeData(data.r));
                data = decodeData(data.r)
                playerCount = data.s;
                updateCount();
                document.getElementById('player-icon').style.display = 'block';
                document.getElementById('player-count').style.display = 'block';
                document.getElementById('loader').style.display = 'none';
                return;
            }
            // Rickroll if too fast
            if ('e' in data) location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
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