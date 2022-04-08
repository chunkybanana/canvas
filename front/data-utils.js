/* ENCODING CONVENTION 
  - Message:

  0b111111111111111111
    [  ][     ][     ]
    color  x      y 

    - Data:
    Uint8Array of length 128 * 128;
*/

let formatMessage = (x, y, color) => {
    return color << 14 | x << 7 | y;
}

let decodeMessage = (message) => {
    return {
        y: message & 0x7F,
        x: message >> 7 & 0x7F,
        color: message >> 14
    }
}

/*let formatData = (data) => {
    const buffer = new ArrayBuffer(data.length / 2);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < data.length; i += 2) {
        view[i / 2] = data[i] | data[i + 1] << 4;
    }
    return buffer;
}*/

let formatData = (data) => {
    // Generates a human-readable string so you can sorta see what's going on. Skips past " because JSON
    return data.flat().map(c => String.fromCharCode(c + 35)).join('');
}

let decodeData = (str) => {
    // Can take any square array.
    let size = Math.sqrt(str.length) | 0;
    let data = Array(size).fill(0).map(() => []);
    for (let i = 0; i < str.length; i++) {
        data[i / size | 0][i % size] = str.charCodeAt(i) - 35;
    }
    return data;
}

let decodeBlob = (blob, decoder) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(decoder(reader.result));
        }
        reader.readAsArrayBuffer(blob);
    })
}

if (typeof module !== 'undefined' && module.exports) module.exports = {
    formatMessage,
    decodeMessage,
    formatData,
    decodeData
};