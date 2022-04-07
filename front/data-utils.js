/* ENCODING CONVENTION 
  - Message:

  0b111111111111111111
    [  ][     ][     ]
    color  x      y 

    - Data:
    Uint8Array of length 128 * 64, each int containing two colours
*/

let formatMessage = (x, y, color) => {
    return color << 14 | x << 7 | y | 1 << 18;
}

let decodeMessage = (message) => {
    return {
        y: message & 0x7F,
        x: message >> 7 & 0x7F,
        color: message >> 14 & 0xF
    }
}

let formatData = (data) => {
    const buffer = new ArrayBuffer(data.length / 2);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < data.length; i += 2) {
        view[i / 2] = data[i] | data[i + 1] << 4;
    }
    return buffer;
}

let decodeData = (data) => {
    const view = new Uint8Array(data);
    return Array.from(view).flatMap(d => [d & 0xF, d >> 4 & 0xF])
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