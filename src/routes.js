// This file is mainly for handling API requests.
// Refer to /src/sim.js for functions related to manipulating the network state

var sim = require('./sim');

exports.displayPage = function(req, res) {
    res.render('index');
}

exports.addNode = function(req, res) {
    var nodes = sim.addNode(req);
    res.status(200).send(nodes);
}

exports.changeNodeParams = function(req, res) {
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

exports.acquireNetworkState = function(req, res) {
    res.json(sim.acquireNetworkState());
}