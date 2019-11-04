// server.js
var express = require('express');
var app = express();
var PORT = 3000;

app.use(express.static(__dirname + '/assets'));
app.engine('.html', require('ejs').__express);
app.set('views', (__dirname + '/views'));
app.set('view engine', 'html');

var routes = require('./src/routes.js');

app.get('/', routes.displayPage);
app.get('/add', routes.addNode);
app.get('/delete', routes.deleteNode);
app.get('/refresh', routes.acquireNetworkState);
app.get('/modify_node', routes.changeNodeParams);

app.listen(PORT, function() {
    console.log('Server is running on PORT:', PORT);
});