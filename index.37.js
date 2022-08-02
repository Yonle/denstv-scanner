/*
 * The known hosts.
 * Add or modify when you found new.
 */
const hosts = ["210.210.155.37"];

/*
 * Sessions:
 * uq2663 = rr.dens.tv
 * dr9445 = rr1.dens.tv
 * qwr9ew = rr2.dens.tv
 * x6bnqe = rr3.dens.tv
 * is6knm = rrelshinta.dens.tv
 */
const sessions = {
  s: ["qwr9ew", "x6bnqe"],
  h: ["uq2663", "dr9445"],
};

/*
 * Endpoints to specific
 * Each channel has a different endpoint.
 */

//const endpoints = ["index.m3u8", "index1.m3u8", "index2.m3u8", "01.m3u8", "02.m3u8"];
//const endpoints = ["index.m3u8", "index1.m3u8", "index2.m3u8"];
const endpoints = ["index.m3u8"];

/*
 * Modules
 * miniget: Simple. Just for sending http or https request.
 * fs: To write m3u8 file.
 */
const { get } = require("http");
const fs = require("fs");
let urls = [];

hosts.forEach((host) => {
  for (type in sessions) {
    for (session in sessions[type]) {
      /*
       * sessions[type][session] => return "qwr9ew" or other
       * type                    => return "s" or "h"
       */

      // Number Sequence, From 1 to 200
      Array.apply(0, Array(500)).forEach((e, i) => {
        i = "" + (i + 1);
        endpoints.forEach((file) => {
          let url =
            "http://" +
            host +
            `/${sessions[type][session]}/${type}/${type}${
              "00".substring(i.length) + i
            }/`;
          urls.push(url);
        });
      });
    }
  }
});

let found = [];
let file = fs.createWriteStream("progress.m3u8");

function write(i) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(i.slice(0, process.stdout.columns));
}

function scan() {
  let url = urls.shift();
  if (!url) {
    file.end();
    fs.writeFileSync("playlist.m3u8", found.join("\n"), "utf8");
    console.log("\n\nDone. Found", found.length, "channels.");
    return process.exit(0);
  }
  if (found.includes(url)) return;
  write(`Found: ${found.length}/${urls.length} | ${url}`);
  get(url + "01.m3u8", { timeout: 15000 }, (res) => {
    if (res.statusCode >= 500) urls.unshift(url);
    if (res.statusCode >= 399) return scan();
    process.stdout.cursorTo(0);
    //process.stdout.clearLine(0);
    if (res.statusCode === 302)
      return get(
        "http://" +
          require("url").parse(url).host +
          require("url").parse(res.headers["location"]).path,
        {
          timeout: 15000,
        },
        (res) => {
          if (res.statusCode >= 500) urls.unshift(url);
          if (res.statusCode >= 399 || 150 > res.headers["content-length"])
            return scan();
          found.push(url + "index.m3u8");
          file.write(url + "index.m3u8" + "\n");
          process.stdout.cursorTo(0);
          console.log(
            found.length + ".",
            res.statusCode,
            url + "index.m3u8",
            res.headers["content-length"]
          );
          scan();
        }
      )
        .on("error", (e) => {
          console.error(e);
          scan();
        })
        .on("abort", scan);

    found.push(url + "index.m3u8");
    file.write(url + "index.m3u8" + "\n");
    console.log(found.length + ".", res.statusCode, url);
    scan();
  })
    .on("error", (e) => {
      console.error(e);
      scan();
    })
    .on("abort", scan);
}

console.log("UseeTV Scanner ---");
console.log(
  "Scanner may take several minutes to complete\n" +
  "Depending of your network connection. Please wait."
);

Array.apply(0, Array(8)).forEach(scan);
