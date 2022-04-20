let updateStats = (stats) => {
    let placedPixels = document.getElementById("placed-pixels");
    let totalPixels = document.getElementById("total-pixels");

    placedPixels.innerText = Object.values(stats[config.iteration - 1]).reduce((a, b) => a + b, 0)
    totalPixels.innerText = stats.flatMap(stat => Object.values(stat)).reduce((a, b) => a + b, 0)

    let colourCounts = {};
    for (let color of config.colors) {
        for (let stat of stats) {
            colourCounts[color] = (colourCounts[color] || 0) + stat[color];
        }
    }

    let sortedColours = Object.entries(colourCounts).sort((a, b) => b[1] - a[1]);
    let topColours = sortedColours.slice(0, 5);
    
    let topColour = document.getElementById("favorite-colors");

    topColour.innerHTML = "";

    for (let [color, count] of topColours) {
        let li = document.createElement("li");
        let span = document.createElement("span");
        span.style.backgroundColor = color;
        span.style.color = "#888";
        span.innerHTML = `&nbsp;`.repeat(5);
        li.appendChild(span);

        let text = document.createElement("span");
        text.innerHTML = `&times;${count}`;
        li.appendChild(text);

        topColour.appendChild(li);
    }

    localStorage.setItem("stats", JSON.stringify(stats));
}
let initStats = () => {
    let stats;
    try {
        stats = (JSON.parse(localStorage.getItem("stats")))
    } catch(e){
        stats = Array(config.iteration)
    }
    for(let i = 0; i < config.iteration; i++) {
        stats[i] ||= {};
        for(let color of config.colors) {
            stats[i][color] ??= 0;
        }
    }
    stats.update = updateStats.bind(null, stats)
    return stats;
}

export default initStats;