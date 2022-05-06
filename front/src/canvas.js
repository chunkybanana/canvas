// Compiled TypeScript.
export default function responsiveCanvas(width, height, container) {
    var innerHeight = () => (container === null || container === void 0 ? void 0 : container.clientHeight) || window.innerHeight;
    var innerWidth = () => (container === null || container === void 0 ? void 0 : container.clientWidth) || window.innerWidth;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.display = 'block';
    canvas.style.margin = '0px';
    canvas.x = 0;
    canvas.y = 0;
    canvas.keys = {};
    canvas.modKeys = {};
    canvas.clicked = false;
    function onLoad() {
        if (innerWidth() / width > innerHeight() / height) {
            canvas.style.height = innerHeight() + 'px';
            canvas.style.width = innerHeight() * width / height + 'px';
            canvas.style.left = (innerWidth() - (innerHeight() * width / height)) / 2 + 'px';
            canvas.style.top = '0px';
        }
        else {
            canvas.style.width = innerWidth() + 'px';
            canvas.style.height = innerWidth() * height / width + 'px';
            canvas.style.top = (innerHeight() - (innerWidth() * height / width)) / 2 + 'px';
            canvas.style.left = '0px';
        }
    }
    function getData(event) {
        if (innerWidth() / width > innerHeight() / height) {
            canvas.x = (event.x - parseInt(canvas.style.left)) * width / parseInt(canvas.style.width);
            canvas.y = event.y * height / innerHeight();
        }
        else {
            canvas.y = (event.y - parseInt(canvas.style.top)) * height / parseInt(canvas.style.height);
            canvas.x = event.x * width / innerWidth();
        }
        if (event.type == 'pointerdown') {
            canvas.clicked = true;
        }
    }
    window.addEventListener('pointerdown', getData);
    window.addEventListener('pointermove', getData);
    window.addEventListener('pointerup', function (event) {
        canvas.clicked = false; // why tf was this null?
    });
    window.addEventListener('keydown', function (event) {
        canvas.keys[event.key] = true;
        canvas.modKeys = { ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey };
    });
    window.addEventListener('keyup', function (event) {
        canvas.keys[event.key] = false;
        canvas.modKeys = { ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey };
    });
    window.addEventListener('resize', onLoad);
    if (container) container.appendChild(canvas);
    else {
        document.body.appendChild(canvas);
    }
    onLoad();
    canvas.resize = onLoad;
    return canvas;
}
