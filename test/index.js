const http = require('http');

console.log("212")

http.createServer(function (req, res) {
    res.writeHead(201, { 'Content-Type': 'text/html' });
    res.write('Hello Http Server 31112`\n');
    res.end();
}).listen(3000);