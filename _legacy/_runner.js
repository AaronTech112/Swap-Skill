const { execSync } = require("child_process");
const fs = require("fs");
const OUT = "c:\\Users\\Z B O O K\\Videos\\swapski\\_verify.out.txt";
const TARGET = "c:\\Users\\Z B O O K\\Videos\\swapski\\_verify.js";
try {
  const stdout = execSync(`node "${TARGET}"`, { encoding: "utf8", timeout: 15000, cwd: "c:\\Users\\Z B O O K\\Videos\\swapski" });
  fs.writeFileSync(OUT, "STDOUT " + stdout.length + " bytes:\n" + stdout, "utf8");
  process.stdout.write(stdout.slice(0, 4000));
} catch (e) {
  const buf = "ERR: " + e.message + "\nstdout:\n" + (e.stdout || "") + "\nstderr:\n" + (e.stderr || "");
  fs.writeFileSync(OUT, buf, "utf8");
  process.stdout.write(buf.slice(0, 4000));
}
