import { GIFEncoder } from 'https://unpkg.com/gifenc@1.0.3'
import historicPalettes from './historic.js';

w.value ||= window.config.size;
h.value ||= window.config.size;

let hextorgb = hex => hex.match(/[0-9a-f]{2}/g).map(x => parseInt(x, 16));

const palette = config.colors.map(hextorgb)

window.makeTimelapse = () => {
    let iteration = document.getElementById('iteration').value;
    fetch(`../log/${iteration}.log`).then(res => res.text()).then(text => {

        const gif = GIFEncoder();

        let lines = text.split('\n');
        let log = lines.map(line => line.split` `).map(([x, y, color, time]) => ({X: parseInt(x), Y: parseInt(y), color: parseInt(color), time: parseInt(time)}));

        let $ = (id) => document.getElementById(id);

        let x = +$('x').value, y = +$('y').value, 
        width = Math.min(+$('w').value, historicPalettes[iteration - 1]?.s || config.size),
        height = Math.min(+$('h').value, historicPalettes[iteration - 1]?.s || config.size), 
        speed = +$('speed').value, size = +$('size').value;

        let startEpoch = new Date($('start').value).getTime(), endEpoch = new Date($('end').value).getTime();
        let data = Uint8Array.from(Array(width * height * size * size).fill(config.background))
        let delay = Math.round(100 / framerate.value) * 10;

        // Where we draw after a certain point, we want to start at the state at that point
        // So we need to render the state until that point
        let prolog = log.filter(({time}) => time < startEpoch);


        for(let {X, Y, color} of prolog) {
            if(X >= x && X < x + width && Y >= y && Y < y + height)
            for(let _x = 0; _x < size; _x++) {
                for(let _y = 0; _y < size; _y++) {
                    data[((Y - y) * size + _y) * width * size + ((X - x) * size + _x)] = color;
                }
            }
        }

        // Then we render the rest of the data, but recording gif frames.
                    

        log = log.filter(({X, Y, color, time}) => X >= x && X < x + width && Y >= y && Y < y + height && time >= startEpoch && time <= endEpoch && X === X);

        for(let i = 0, offset = 0; i < log.length; i += speed, offset += speed) {
            // Would put a progress bar here, but it takes ages to update
            // And I don't want to use weeb workers
            for(let j = 0; j < speed && i + j < log.length; j++){
                let {X, Y, color} = log[i + j];
                for(let _y = 0; _y < size; _y++) {
                    for(let _x = 0; _x < size; _x++) {
                        data[((Y - y) * size + _y) * width * size + ((X - x) * size + _x)] = color;
                    }
                }
            }
            gif.writeFrame(data, width * size, height * size, 
                {palette: historicPalettes[iteration - 1]?.p ?? palette, delay})
        }

        gif.finish();

        // Download
        let blob = new Blob([gif.bytesView()], {type: 'image/gif'});

        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${iteration}.gif`;
        a.click();
    })
}

// A bit messy, will fix at some point
window.createHeatmap = () => {
    let iteration = document.getElementById('iteration').value;
    fetch(`../log/${iteration}.log`).then(res => res.text()).then(text => {
        let lines = text.split('\n');
        let log = lines
            .map(line => line.split` `)
            .map(([x, y, color]) => ({x: parseInt(x), y: parseInt(y), color: parseInt(color)}))
            .filter(({x, y, color}) => x == x && y === y && color === color);

        let data = Array(config.size).fill(0).map(a => Array(config.size).fill(0));
  
  		for (let {x, y, color} of log) {
            data[y][x]++;
        }
  
        let max = Math.max(...data.map(v => Math.max(...v)));

        let canvas = document.createElement('canvas');
        canvas.width = config.size;
        canvas.height = config.size;
        let ctx = canvas.getContext('2d')

        // Bluish colors with certain saturation values
        for (let y in data) {
            for(let x in data[y]) {
                ctx.fillStyle = `hsl(240, 50%, ${(100 - Math.log(data[y][x]) * 100 / Math.log(max)).toFixed(2)}%)`;
                ctx.fillRect(x, y, 1, 1);
            }
        }	
  		let a = document.createElement('a');
        a.href = canvas.toDataURL();
        a.download = 'heatmap.png';
        a.click();
    })
}