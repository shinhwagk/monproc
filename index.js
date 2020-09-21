const http = require('http');

http.createServer(function(req, res){
    res.writeHead(201, {'Content-Type': 'text/html'});
    res.write('Hello Http Server 3\n');
    res.end();
}).listen(3001);