// Stub minimal globals so we can import data.js + parts of app.js logic without DOM.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const OUT_JSON = "c:\\Users\\Z B O O K\\Videos\\swapski\\_verify.results.json";

const dataJs = fs.readFileSync(path.join(__dirname, "data.js"), "utf8");
const appJs = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");

// Minimal DOM/window stub
const doc = { createElement: () => ({}), querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} };
const win = { document: doc, localStorage: { getItem:() => null, setItem:()=>{}, removeItem:()=>{}, clear:()=>{} }, matchMedia: () => ({ matches: false }), addEventListener: () => {}, location: { hash: "" }, console };
const ctx = { window: win, document: doc, console, localStorage: win.localStorage, setTimeout, clearTimeout, setInterval, clearInterval, module: undefined, require, __dirname: __dirname };
vm.createContext(ctx);

try {
  vm.runInContext(dataJs, ctx, { filename: "data.js" });
} catch(e) {
  fs.writeFileSync(OUT_JSON, JSON.stringify({error:"data.js",msg:e.message}));
  throw e;
}

// Only import only the getWalletMetrics and related helper pure functions by pulling them off ctx
try {
  vm.runInContext(appJs, ctx, { filename: "app.js" });
} catch (e) {
  // fine, DOM calls at boot throw; continue (define-time errors are OK as long as getWalletMetrics is defined
}

const { SEED_DATA, artwork } = ctx;
const getWalletMetrics = ctx.getWalletMetrics;
const getUser = ctx.getUser;
const users = SEED_DATA.users;

const results = {};
results.users = users.map((u) => {
  const w = getWalletMetrics(u.id);
  return { id:u.id, name:u.name, handle:u.handle, email:u.email, location:u.location, timezone:u.timezone, avatar:u.avatar, earned:w.earned, spent:w.spent, escrow:w.escrow, available:w.available };
});
results.services = SEED_DATA.services.map(s => {
  const owner = getUser(s.userId);
  const w = getWalletMetrics(s.userId);
  return { id:s.id, title:s.title, cost:s.creditCost, owner:owner?.name, ownerAvail:w.available, requesterCanAfford: w.available >= s.creditCost };
});
const OLD = /Maya Chen|Leo Hart|Sana Noor|Rafael Costa|mayacraft|leohart|sananoor|rafbuilds|Singapore|Toronto|Berlin|Sao Paulo/;
results.seedHasOldNames = OLD.test(JSON.stringify(SEED_DATA));
results.bookingCase = [];
const me = users[0];
const svc = SEED_DATA.services[0];
const mw = getWalletMetrics(me.id);
results.bookingCase.push({ me: me.name, meAvail: mw.available, svc: svc.title, cost: svc.creditCost, canBook: mw.available >= svc.creditCost });

fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));
console.log("WROTE RESULTS to", OUT_JSON, "bytes=", JSON.stringify(results).length);
