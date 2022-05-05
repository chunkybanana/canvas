(async () => {
    if (process.argv.length != 5) {
        console.error("Expects three args: hours input.log output.log");

        process.exit(1);
    }

    var fs = require("fs").promises;

    var hours = +process.argv[2];

    if (Number.isNaN(hours) || !Number.isFinite(hours) || hours < 0) {
        console.error("Hours must be a positive number");

        process.exit(2);
    }

    var since = Date.now() - (hours * 3600 * 1000);

    var original_size = 0;

    try {
        var log = await fs.readFile(process.argv[3], "utf-8");

        original_size = log.split("\n").filter(x => x).length;

        log = log.split("\n").filter(x => x).filter(x => +x.match(/\d+/g)[3] < since);
    } catch (info) {
        console.error("Input must be a valid log file");

        process.exit(3);
    }

    console.log("Rolled back " + (original_size - log.length) + " changes");

    await fs.writeFile(process.argv[4], log.join("\n") + "\n");
})();
