(async () => {
    if (process.argv.length != 6) {
        console.error("Expects four args: size fill input.log output.json");

        process.exit(1);
    }

    var fs = require("fs").promises;

    var size = +process.argv[2];

    if (Number.isNaN(size) || !Number.isInteger(size) || size <= 0) {
        console.error("Size must be a positive integer");

        process.exit(2);
    }

    var fill = +process.argv[3];

    if (Number.isNaN(fill) || !Number.isInteger(fill) || fill <= 0) {
        console.error("Fill must be a positive integer");

        process.exit(3);
    }

    try {
        var log = await fs.readFile(process.argv[4], "utf-8");

        log = log.split("\n").filter(x => x).map(x => x.trim().split(" ")).map(x => [+x[0], +x[1], +x[2]]).filter(x => !Number.isNaN(x[2]));

        if (log.some(l => Number.isNaN(l[0]) || Number.isNaN(l[1]) || Number.isNaN(l[2]) || !Number.isInteger(l[0]) || !Number.isInteger(l[1]) || !Number.isInteger(l[2]) || l[0] < 0 || l[1] < 0 || l[2] < 0 || l[0] >= size || l[1] >= size))
            throw "xD";
    } catch (info) {
        console.error("Input must be a valid log file");

        process.exit(4);
    }

    var data = [...Array(size)].map(_ => Array(size).fill(fill));

    for (var pix of log)
        data[pix[1]][pix[0]] = pix[2];

    await fs.writeFile(process.argv[5], JSON.stringify(data));
})();
