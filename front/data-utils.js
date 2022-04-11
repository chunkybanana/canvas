/* ENCODING CONVENTION 
  - Message:

  0b111111111111111111
    [  ][     ][     ]
    color  x      y 

    - Data:
    String of length 128^2 with characters A-X+
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
let formatData = (data) => {
    // Generates a human-readable string so you can sorta see what's going on. Starts at A so you can spell AMOGUS in the server logs.
    return data.flat().map(c => String.fromCharCode(c + 65)).join('');
}

let decodeData = (str) => {
    // Can take any square array.
    let size = Math.sqrt(str.length) | 0;
    let data = Array(size).fill(0).map(() => []);
    for (let i = 0; i < str.length; i++) {
        data[i / size | 0][i % size] = str.charCodeAt(i) - 65;
    }
    return data;
}

if (typeof module !== 'undefined' && module.exports) module.exports = {
    formatMessage,
    decodeMessage,
    formatData,
    decodeData
};