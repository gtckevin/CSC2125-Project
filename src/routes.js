// This file is mainly for handling API requests.
// Refer to /src/sim.js for functions related to manipulating the network state

var sim = require('./sim');

exports.displayPage = function(req, res) {
    res.render('index');
}

exports.addNode = function(req, res) {
    console.log(req.body);

    var nodes = sim.addNode(req);
    res.status(200).send(nodes);
}

exports.getNodeInfo = function(req, res) {

}

exports.deleteNode = function(req, res) {
    switch(sim.deleteNode(req)) {
        case 200:
            res.status(200).send('Successfully delete node' + req.query.nodeId);
            break;
        case 500:
            res.status(500).send('Node already delete!');
            break;
        default:
            res.status(500).send('Unknown error');
            break;
    }
}

exports.changeNodeParams = function(req, res) {
    console.log(req.body);

    switch(sim.changeNodeParams(req)) {
        case 200:
            res.status(200).send('Successfully change node param');
            break;
        case 500:
            res.status(500).send('Node already delete!');
            break;
        default:
            res.status(500).send('Unknown error');
            break;
    }
}

exports.initNetworkParams = function(req, res) {
    console.log("Initializing network with params:");
    console.log(req.body);

    /* 
    req.body = {
        "protocol": "longestChain" | "GHOST" | "DAG",
        "nodeCount": integer,
        "defaultNodeHash": integer,
        "networkLatency": integer,
        "bandwidth": integer,
        "blockSize": integer,
        "blockGenerationTime": integer
    }
    */

    // sim.js needs a function to handle initializing network parameters
    // replace switch(ret) with switch(sim.whatever-you-name-the-function)
    var ret = 200;
    switch(ret) {
        case 200:
            res.status(200).send('Successfully initialized network');
            break;
        case 500:
            res.status(500).send('Failed to initialize network');
            break;
        default:
            res.status(500).send('Unknown error');
            break;
    }
}

exports.acquireNetworkState = function(req, res) {
    res.json(sim.acquireNetworkState());
}

exports.changeNetworkParams = function(req, res) {
    console.log(req.body);
}