// needs some slight modification for shift / rect selection
import Scroller from '../src/scroller/Scroller.js';

let initScroller = (updateDisplay, setZoom, canvas, document) => {
    let scroller = new Scroller((left, top, z) => {
        setZoom({left, top, z});
        updateDisplay();
    }, {
        zooming: true,
        bouncing: false,
        minZoom: 1,
        // Placing tiny pixels on mobile is *hard*.
        maxZoom: window.config.maxZoom,
    });

    
    let canvasSize = parseInt(canvas.style.width);

    let onresize = () => {
        scroller.setDimensions(canvasSize, canvasSize, canvasSize, canvasSize);
        
        // Scroller is on the canvas
        scroller.setPosition(
            (window.innerWidth - Math.min((window.innerHeight - 60), window.innerWidth)) / 2,
            (window.innerHeight - Math.min((window.innerHeight - 60), window.innerWidth) - 60) / 2
        );
    }
    onresize();
    window.addEventListener('resize', onresize);    


    canvas.addEventListener("touchstart", function(e) {
        // Magic
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

    canvas.addEventListener("mousedown", function(e) {
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

    canvas.addEventListener("wheel", function(e) {
        scroller.doMouseZoom((e.detail ? (e.detail * -120) : e.wheelDelta) * -config.maxZoom * 1.5, e.timeStamp, e.pageX, e.pageY);
    }, false);


    // Handle keyed movement
    window.addEventListener('keydown', () => {
        let DIST = 10, keys = canvas.keys;
        if (keys.ArrowUp || keys.w) {
            scroller.scrollBy(0, -DIST, true);
            updateDisplay();
        }

        if (keys.ArrowDown || keys.s) {
            scroller.scrollBy(0, DIST, true);
            updateDisplay();
        }

        if (keys.ArrowLeft || keys.a) {
            scroller.scrollBy(-DIST, 0,  true);
            updateDisplay();
        }

        if (keys.ArrowRight || keys.d) {
            scroller.scrollBy(DIST, 0, true);
            updateDisplay();
        }

        if (keys.z) {
            scroller.zoomBy(1.1, true);
            updateDisplay();
        }

        if(keys.x) {
            scroller.zoomBy(0.9, true);
            updateDisplay();
        }
    })

    return scroller;
}

export default initScroller;