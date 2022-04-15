import {
    GIFEncoder, quantize, applyPalette
  } from 'https://unpkg.com/gifenc@1.0.3'

//let setText = text => document.getElementById('log').innerText = text;

const palette = [[163,23,23],[252,0,0],[253,165,0],[254,215,0],[200,240,129],[41,242,34],[26,174,0],[64,224,208],[30,144,255],[8,0,255],[134,1,154],[238,70,238],[239,192,203],[0,0,0],[85,85,85],[204,204,204],[255,255,255],[106,61,24],[251,220,188],[30,190,114],[68,102,161],[0,64,141],[114,137,218],[253,154,255]]

window.loadLog = () => {
    let iteration = document.getElementById('iteration').value;
    fetch(`../log/${iteration}.log`).then(res => res.text()).then(text => {

        const gif = GIFEncoder();

        let lines = text.split('\n');
        let log = lines.map(line => line.split` `).map(([x, y, color]) => ({x: parseInt(x), y: parseInt(y), color: parseInt(color)}));

        let data = Uint8Array.from(Array(128 * 128).fill(16))

        for(let i = 0; i < log.length; i += 3) {
            for(let j = 0; j < 3; j++) if(log[i + j] && log[i + j].x === log[i + j].x) {
                let {x, y, color} = log[i + j];
                data[y * 128 + x] = color;
            }
            gif.writeFrame(data, 128, 128, {palette, delay: 20})
        }

        gif.finish();

        let blob = new Blob([gif.bytesView()], {type: 'image/gif'});

        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${iteration}.gif`;
        a.click();
    })
}