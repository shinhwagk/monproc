import * as test from './dist/test'

const http = require('http');
test.test()
console.log("1231")
http.createServer(function(req, res){
    res.writeHead(201, {'Content-Type': 'text/html'});
    res.write('Hello Http Server 2\n');
    res.end();
    test.test()

}).listen(3001);