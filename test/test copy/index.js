const http = require('http');

console.log("2")

http.createServer(function (req, res) {
    res.writeHead(201, { 'Content-Type': 'text/html' });
    res.write('He1llo Http Server 31\n');
    res.end();
}).listen(3000);