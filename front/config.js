const config = {
    server: true,
    local: false,        // canvas.rto.run vs localhost:8080
    size: 192,
    port: 8080,
    colors: [
        "#a31717","#fc0000","#fda500","#fed700","#c8f081","#29f222",
        "#1ebe72","#1aae00","#40e0d0","#1e90ff","#0800ff","#86019a","#86334d",
        "#ee46ee","#fd9aff","#efc0cb","#6a3d18","#a16932","#fbdcbc","#00408d",
        "#4466a1","#7289da","#000000","#555555","#cccccc","#ffffff",],
    delay: 2,            // Delay between clicks, in seconds
    iteration: 3,
    maxZoom: 20,         // Increase when adjusting canvas size
    framesToSave: 100,   // Amount of changes before saving logs / backing up state
    defaultSelected: 22, // Indices in palette
    background: 25
}

globalThis.config = config;

if(typeof module !== 'undefined' && module.exports) module.exports = config;

