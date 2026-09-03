const fs = require("fs");
const h = fs.readFileSync("C:/cxy/store-series.html", "utf8");
console.log("len", h.length);
const imgs = h.match(/<img[^>]+src="[^"]+"/g) || [];
console.log("imgs", imgs.length);
imgs.slice(0, 10).forEach((i) => console.log(" ", i.slice(0, 180)));
const links = h.match(/href="([^"]*product[^"]*)"/gi) || [];
console.log("product links", links.length);
links.slice(0, 8).forEach((l) => console.log(" ", l.slice(0, 150)));
// 找型号文本链接
const modelLinks = h.match(/href="([^"]*)"[^>]*>[^<]*(SDS\d[^<]*)/g) || [];
console.log("model links", modelLinks.length);
modelLinks.slice(0, 8).forEach((l) => console.log(" ", l.slice(0, 150)));
