const http = require('http');

console.log("111111111211")

http.createServer(function (req, res) {
    res.writeHead(201, { 'Content-Type': 'text/html' });
    res.write('Hello Http Server 31\n');
    res.end();
}).listen(3000);