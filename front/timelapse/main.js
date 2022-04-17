import { GIFEncoder } from 'https://unpkg.com/gifenc@1.0.3'

//let setText = text => document.getElementById('log').innerText = text;

const palette = [[163,23,23],[252,0,0],[253,165,0],[254,215,0],[200,240,129],[41,242,34],[26,174,0],[64,224,208],[30,144,255],[8,0,255],[134,1,154],[238,70,238],[239,192,203],[0,0,0],[85,85,85],[204,204,204],[255,255,255],[106,61,24],[251,220,188],[30,190,114],[68,102,161],[0,64,141],[114,137,218],[253,154,255]]

window.makeTimelapse = () => {
    let iteration = document.getElementById('iteration').value;
    fetch(`../log/${iteration}.log`).then(res => res.text()).then(text => {

        const gif = GIFEncoder();

        let lines = text.split('\n');
        let log = lines.map(line => line.split` `).map(([x, y, color, time]) => ({X: parseInt(x), Y: parseInt(y), color: parseInt(color), time: parseInt(time)}));

        let $ = (id) => document.getElementById(id);

        let x = +$('x').value, y = +$('y').value, width = +$('w').value, height = +$('h').value, speed = +$('speed').value, size = +$('size').value;

        let startEpoch = new Date($('start').value).getTime(), endEpoch = new Date($('end').value).getTime();

        let data = Uint8Array.from(Array(width * height * size * size).fill(16))
        let delay = Math.round(100 / framerate.value) * 10;


        log = log.filter(({X, Y, color, time}) => X >= x && X < x + width && Y >= y && Y < y + height && time >= startEpoch && time <= endEpoch && X === X);

        for(let i = 0, offset = 0; i < log.length; i += speed, offset += speed) {
            /*if(offset > log.length / 100) {
                console.log('updating timer', i / log.length * 100)
                offset = 0;
                setTimeout(() => $('fill').style.width = ((i / log.length) * 600).toFixed(2) + 'px', 1)
                //$('text').innerText = `${(i / log.length * 100).toFixed(2)}%`;
            }*/
            for(let j = 0; j < speed && i + j < log.length; j++){
                let {X, Y, color} = log[i + j];
                for(let _y = 0; _y < size; _y++) {
                    for(let _x = 0; _x < size; _x++) {
                        data[(Y * size + _y) * width * size + (X * size + _x)] = color;
                    }
                }
            }
            gif.writeFrame(data, width * size, height * size, {palette, delay})
        }


        gif.finish();

        let blob = new Blob([gif.bytesView()], {type: 'image/gif'});

        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${iteration}.gif`;
        a.click();
    })
}

window.createHeatmap = () => {
    let iteration = document.getElementById('iteration').value;
    fetch(`../log/${iteration}.log`).then(res => res.text()).then(text => {
        let lines = text.split('\n');
        let log = lines
            .map(line => line.split` `)
            .map(([x, y, color]) => ({x: parseInt(x), y: parseInt(y), color: parseInt(color)}))
            .filter(({x, y, color}) => x == x && y === y && color === color);

        let data = Array(128).fill(0).map(a => Array(128).fill(0));
  
  		for (let {x, y, color} of log) {
            data[y][x]++;
        }
  
        let max = Math.max(...data.map(v => Math.max(...v)));

        let canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        let ctx = canvas.getContext('2d')

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