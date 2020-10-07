"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const server = function (req, res) {
    res.writeHead(201, { 'Content-Type': 'text/html' });
    res.write('Hello Http Server 3\n');
    res.end();
};
http.createServer(server).listen(3001);
