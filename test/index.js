// @ts-check
const http = require('http')

/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
const server = function (req, res) {
    res.writeHead(201, { 'Content-Type': 'text/html' });
    res.write('Hello Http Server 31\n');
    res.end();
}
http.createServer(server).listen(3001, () => console.log("start"));