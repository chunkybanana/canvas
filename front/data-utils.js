let formatMessage = (x, y, color) => {
    return [x, y, color].join`,`;
}

let decodeMessage = (message) => {
    let [x, y, color] = message.toString().split`,`.map(Number);
    return {x, y, color}
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
}; else {
    window.formatMessage = formatMessage;
    window.decodeMessage = decodeMessage;
    window.formatData = formatData;
    window.decodeData = decodeData;
}