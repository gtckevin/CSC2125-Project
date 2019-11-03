// server.js
var express = require('express');
var app = express();
var PORT = 3000;

//Models
var Node = require('./models/nodes');
var Block = require('./models/blockchain');

/*
object need to remember

nodes array

*/
var nodes = [];

// portocols 
var longestChain = "longestChain";
var GHOST = "GHOST";
var DAG = "DAG";

//Default
var defaultHashRate = 10;
var defalutHonestOrAttacker = true;
var currentNodeLength = 0;


app.get('/', function(req, res) {
    console.log(req.params);

    res.status(200).send('CSC2125');
});

//add N node, depend on numberofNode pass in ex: http://localhost:3000/AddNode?numberOfNode=2
app.get('/AddNode', function(req, res) {
    var numberOfNode = parseInt(req.query.numberOfNode);
    console.log(req.query.numberOfNode);
    console.log(numberOfNode);
    var lenOfNodes = nodes.length;

    for(var i = 0; i < numberOfNode; i++) {
        var node = new Node(lenOfNodes + i, longestChain, defaultHashRate, defalutHonestOrAttacker, 0);
        //console.log(nodeObj);
        //var node = {nodeId:lenOfNodes + i, protocol:longestChain, hashRate:defaultHashRate, honestOrAttacker:defalutHonestOrAttacker};
        nodes.push(node);
    }
    currentNodeLength += numberOfNode;
    console.log(nodes);
    console.log(currentNodeLength);
    res.status(200).send(nodes);
})

// change node params, ex: http://localhost:3000/ChangeNodeParams?nodeId=1&hashRate=30.25&honestOrAttacker=false
app.get('/ChangeNodeParams', function(req, res) {
    var reqNodeId = parseInt(req.query.nodeId);
    var reqProtocol = req.query.protocol;
    var reqHashRate = parseFloat(req.query.hashRate);
    var reqHonestOrAttacker =  req.query.honestOrAttacker; 

    var node = nodes[reqNodeId];
    if(node) {  // if the node is not been delete
        //could have getter of setter to do this
        node.protocol = (reqProtocol == null) ? node.protocol : reqProtocol;
        node.hashRate = (reqHashRate == null) ? node.hashRate : reqHashRate;
        node.honestOrAttacker = (reqHonestOrAttacker == null) ? node.honestOrAttacker : (reqHonestOrAttacker == true);
        nodes[reqNodeId] = node;
        
        //debug
        console.log(nodes);
        res.status(200).send('Successfully change node param');
    } else {

        //debug
        console.log(nodes);
        res.status(500).send('Node already delete!');
    }
})

//delete node
app.get('/DeleteNode', function(req, res) {
    var reqNodeId = parseInt(req.query.nodeId);

    var node = nodes[reqNodeId];
    if(node) {
        nodes[reqNodeId] = null;
        //debug
        console.log(nodes);
        currentNodeLength--;
        res.status(200).send('Successfully delete node' + req.query.nodeId);
    } else {
        //debug
        console.log(nodes);
        res.status(500).send('Node already delete!');
    }
    console.log(currentNodeLength);

}) 
app.listen(PORT, function() {
    console.log('Server is running on PORT:',PORT);
});
