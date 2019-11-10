// server.js
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var PORT = 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/assets'));
app.engine('.html', require('ejs').__express);
app.set('views', (__dirname + '/views'));
app.set('view engine', 'html');

var routes = require('./src/routes.js');

app.get('/', routes.displayPage);

app.post('/nodes', routes.addNode);

app.get('/nodes/:nodeId', routes.getNodeInfo);
app.put('/nodes/:nodeId', routes.changeNodeParams);
app.delete('/nodes/:nodeId', routes.deleteNode);

app.get('/network', routes.acquireNetworkState);
app.post('/network', routes.initNetworkParams);
app.put('/network', routes.changeNetworkParams);

app.listen(PORT, function() {
    console.log('Server is running on PORT:', PORT);
});