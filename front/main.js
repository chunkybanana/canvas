const COLORS = ["red", "orangered", "orange", "gold", "yellow", "yellowgreen", "lime", "green", "turquoise", "dodgerblue", "blue", "indigo", "violet", "pink", "black", "white"];

const canvas = responsiveCanvas(128, 128, document.getElementById("canvas-container"));
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const buttons = document.getElementById("buttons");
const timer = document.getElementById("timer");

const ws = new WebSocket("ws://localhost:8010");

let lastClick = 0;
let drawColor = 'black';

let recievedData;

for (let color of COLORS) {
    const button = document.createElement("button");
    button.classList.add('color-button')
    button.title = color;
    button.style.backgroundColor = color;
    button.addEventListener("click", () => {
        drawColor = color;
        for(let button of buttons.childNodes) {
            button.classList.remove('active');
        }
        button.classList.add('active');
    });
    buttons.appendChild(button);
}
buttons.childNodes[14].click();
let startCountdown = () => {
    let time = Date.now() - lastClick;
    if (time > 5000) {
        timer.textContent = "";
        for(let button of buttons.childNodes) {
            button.disabled = false;
        }
        canvas.disabled = false;
        return;
    }
    timer.textContent = ((5000 - time) / 1000).toFixed(2);
    setTimeout(startCountdown, 20);
}

let showModal = (bool) => {
    document.getElementById("info-modal").style.display = bool ? "block" : "none";
}

canvas.addEventListener('pointerdown', () => {
    if (Date.now() - lastClick > 5000 && canvas.x < 256 && canvas.y > 0 && canvas.y < 256 && canvas.x > 0) {
        lastClick = Date.now();
        var x = Math.floor(canvas.x), y = Math.floor(canvas.y);
        startCountdown();
        for(let button of buttons.childNodes) {
            button.disabled = true;
            canvas.disabled = true;
        }
        drawRect(x, y, drawColor);
        ws.send(formatMessage(x, y, COLORS.indexOf(drawColor)).toString());
    }
})

function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1)
}

function render(data) {
    for (let i = 0; i < data.length; i++) {
        drawRect(i >> 7 & 0x7F, i & 0x7F, COLORS[data[i]])
    }
}

ws.onopen = () => {
    recievedData = false;
}

ws.onmessage = message => {
    console.log('got me some data', message.data);
    if(!recievedData) {
        recievedData = true;
        decodeBlob(message.data, decodeData).then(data => {
            render(data)
        });
        return;
    }
    /*const reader = new FileReader();
    reader.onload = () => {
        var decoded = decodeMessage(parseInt(reader.result));
        drawRect(decoded.x, decoded.y, decoded.color);
    }
    reader.readAsText(message.data);*/
    message.data.text().then((data) => {
        var decoded = decodeMessage(parseInt(data));
        console.log(decoded, data);
        drawRect(decoded.x, decoded.y, COLORS[decoded.color]);
    })
}