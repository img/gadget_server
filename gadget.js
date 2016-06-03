var express = require('express');
var crypto = require('crypto');
var exec = require("child_process").exec;
var fs = require('fs');
var app = express();
var https = require('https');
var path = require('path')
  , certsPath = path.join(__dirname, 'certs', 'server')
, caCertsPath = path.join(__dirname, 'certs', 'ca');

function rawBody(req, res, next) {
//  res.setHeader('Content-Type', 'application/rdf+xml');
  req.setEncoding('utf8');
  req.rawBody = '';
  req.on('data', function(chunk) {
    req.rawBody += chunk;
  });
  req.on('end', function(){
    next();
  });
}

//
// SSL Certificates
//
options = {
  key: fs.readFileSync(path.join(certsPath, 'my-server.key.pem'))
, ca: [ fs.readFileSync(path.join(caCertsPath, 'my-root-ca.crt.pem')) ]
, cert: fs.readFileSync(path.join(certsPath, 'my-server.crt.pem'))
, requestCert: false
, rejectUnauthorized: false
};


app.configure(function(){
    app.use(rawBody);
    app.use('/',express.static(__dirname));
});
https.createServer(options, app).listen(9092);
console.log('Listening on 9092');

