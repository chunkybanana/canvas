const config = {
    server: true,
    local: true,
    size: 192,
    port: 8080,
    colors: ["#a31717","#fc0000","#fda500","#fed700","#c8f081","#29f222","#1aae00","#40e0d0","#1e90ff","#0800ff","#86019a","#ee46ee","#efc0cb","#000000","#555555","#cccccc","#ffffff","#6a3d18","#fbdcbc","#1ebe72","#4466a1","#00408d","#7289da","#fd9aff"],
    delay: 2,
    iteration: 3,
    maxZoom: 20,
}

globalThis.config = config;

if(typeof module !== 'undefined' && module.exports) module.exports = config;

