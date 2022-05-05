(async () => {
    if (process.argv.length != 5) {
        console.error("Expects three args: conn_id input.log output.log");

        process.exit(1);
    }

    var fs = require("fs").promises;

    var conn_id = process.argv[2];

    if (conn_id.length != 12 || conn_id.match(/[^0-9a-f]/)) {
        console.error("Conn ID must be a 12-digit hexadecimal ID");

        process.exit(2);
    }

    var original_size = 0;

    try {
        var log = await fs.readFile(process.argv[3], "utf-8");

        original_size = log.split("\n").filter(x => x).length;

        log = log.split("\n").filter(x => x).filter(x => x.match(/\w+/g)[4] != conn_id);
    } catch (info) {
        console.error("Input must be a valid log file");

        process.exit(3);
    }

    console.log("Rolled back " + (original_size - log.length) + " changes");

    await fs.writeFile(process.argv[4], log.join("\n") + "\n");
})();
