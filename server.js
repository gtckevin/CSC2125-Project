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
block map (blockId: blockObject)

*/
var nodes = [];
var longestBlockChain = [];
var forkBranches = [];  // 2d-array
var blockMap = new Map();
var initBlock = new Block( -1, -1);
blockMap.set(-1, initBlock);
longestBlockChain.push(initBlock);


// portocols 
var longestChain = "longestChain";
var GHOST = "GHOST";
var DAG = "DAG";

//Default
var defaultHashRate = 10;
var defalutHonestOrAttacker = true;
var currentNodeLength = 0;
var latestBlockId = -1;


app.get('/', function(req, res) {
    var arr = [1,2,3];
    arr.reverse();
    

    console.log(arr);
    res.status(200).send('CSC2125');
});

//helper functions
function blockGenerationLogestChain(){
    //check if we already have fork branch, if so record how many block in fork branch
    var blocksInForkBranches = forkBranches.length;
    var currentIterForkBranches = [];
    //each node working on POW check if they get a valid block or not
        //first it need to check which branch to work on. 
    for(var i = 0; i < nodes.length; i++) {

        var found = blockGenerationLogestChainHonestHelper(nodes[i]);
        console.log(found);
        // Now we know if we found an block or not base on different type of protocol add valid block or continue to next node
        if(found) {
            if(nodes[i].honestOrAttacker == true) { //honest node
                addBlockToNetwork(nodes[i], currentIterForkBranches);
            } else { // attacker node

            }
        }

    }
    // now one iterations is done we need to check if we have resolved fork branch or not.
    console.log("currentIterForkBranches: " + currentIterForkBranches);
    console.log("before resolved Longest Chain: " + longestBlockChain);
    resolvedLongestChain(blocksInForkBranches, currentIterForkBranches);
    console.log("after resolved Longest Chain: " + longestBlockChain);


}
    /*
        There are main cases:
        1. There are no fork branch before. 
            1.1 only found one block in this iterations directly add to longest chain.
            1.2 more than one block found, has fork branch now.
        2. There are fork branch before.
            2.1 only found one block, resolve the fork branches
            2.2 more than one block, try to find the longest chain, if not keep the fork branches
    */
function resolvedLongestChain(blocksInForkBranches, currentIterForkBranches) {
    var curBlock = longestBlockChain[longestBlockChain.length - 1];

    //Case 1
    if(blocksInForkBranches == 0) {
        //Case 1.1
        if(currentIterForkBranches.length == 1) {
            longestBlockChain.push(currentIterForkBranches[0]);
            currentIterForkBranches.pop();  
        } else { //Case 1.2
            forkBranches.push(currentIterForkBranches);
        }
        
    } else { // Case 2
        // Case 2.1
        if(currentIterForkBranches.length == 1) {   
            // find the beginning of the sub tree
            var subBlock = currentIterForkBranches[0];
            var subLongestChain = [];
            subLongestChain.push(subBlock);

            for(var i = forkBranches.length - 1; i >= 0; i--) {
                for(var j = 0; j < forkBranches[i].length; j++) {
                    if(forkBranches[i][j].blockId == subBlock.preBlockId) { // find parenters of current subBlock, add to array that need to add to longest chain
                        subBlock = forkBranches[i][j];
                        subLongestChain.push(subBlock);
                        break;
                    } else { 

                    }
                    // delete this block from forkBranches and set any node working on this branch to the newest blockID(currentIterForkBranches[0].blockId)
                    resetNodesAcceptPreBlock(forkBranches[i][j].blockId, currentIterForkBranches[0].blockId);
                    // delete this block from blockMap
                    blockMap.delete(forkBranches[i][j].blockId)
                    //forkBranches[i].splice(j, 1);
                    //j++;
                }
            }
            subLongestChain.reverse();
            // Now subLongestChain contain all the block need to add to longest chain
            for(var i = 0; i < subLongestChain.length; i++) {
                longestBlockChain[longestBlockChain.length - 1].nextBlocks = [subLongestChain[i]]; // reset the last block in longestchain's nextBlocks
                longestBlockChain.push(subLongestChain[i]);
            }
            currentIterForkBranches = [];
            forkBranches = []; //reset the forkBranches
        } else {
            // Case 2.2
            forkBranches.push(currentIterForkBranches);
            currentIterForkBranches = [];
        }
    }
}
function resetNodesAcceptPreBlock(needResetBlockId, setToBlockId) {
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i].acceptPreBlock == needResetBlockId) {
            nodes[i].acceptPreBlock = setToBlockId;
        }
    }
}

function blockGenerationLogestChainHonestHelper(node){
    var hashRatio = currentNodeHashRatioOnCurrentBranch(node);
    var randomNum = Math.floor((Math.random() * 100) + 1);
    if(randomNum <= hashRatio * 100) {
        return true; //find a valid block
    }
    return false; 
}

function currentNodeHashRatioOnCurrentBranch(node) {
    var blockId = node.blockId;
    var totalHashRate = 0;
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i] && nodes[i].blockId == blockId) {
            totalHashRate += nodes[i].hashRate;
        }
    }
    return node.hashRate / totalHashRate;
}

function addBlockToNetwork(node, currentIterForkBranches) {
    var validBlock = new Block(latestBlockId + 1, node.nodeId, node.acceptPreBlock);
    var perBlock = blockMap.get(node.acceptPreBlock);
    nodes[node.nodeId].acceptPreBlock = latestBlockId + 1; // update the nodeID
    blockMap.set(latestBlockId + 1, validBlock);  // add the new block to block map
    perBlock.nextBlocks.push(validBlock);       // push the current block on to the block map

    currentIterForkBranches.push(validBlock); // push all the found block in forkBranches
    latestBlockId += 1;
}

//add N node, depend on numberofNode pass in ex: http://localhost:3000/AddNode?numberOfNode=2
app.get('/AddNode', function(req, res) {
    var numberOfNode = parseInt(req.query.numberOfNode);
    console.log(req.query.numberOfNode);
    console.log(numberOfNode);
    var lenOfNodes = nodes.length;

    for(var i = 0; i < numberOfNode; i++) {
        var node = new Node(lenOfNodes + i, longestChain, defaultHashRate, defalutHonestOrAttacker, -1); // no block yet, set block id to -1
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
    var reqTypeOfAttack = req.query.typeOfAttack; 

    var node = nodes[reqNodeId];
    if(node) {  // if the node is not been delete
        //could have getter of setter to do this
        node.protocol = (reqProtocol == null) ? node.protocol : reqProtocol;
        node.hashRate = (reqHashRate == null) ? node.hashRate : reqHashRate;
        node.honestOrAttacker = (reqHonestOrAttacker == null) ? node.honestOrAttacker : (reqHonestOrAttacker == true);
        if(reqHonestOrAttacker && reqHonestOrAttacker != node.honestOrAttacker) {
            node.honestOrAttacker = reqHonestOrAttacker;    // need to change honestOrAttacker for the node
            if(reqHonestOrAttacker == true) {   
                node.typeOfAttack = null;
            } else {
                if(reqTypeOfAttack) {
                    node.typeOfAttack = reqTypeOfAttack;
                }  else {
                    res.status(500).send("User input an attacker node and not change type of attack");
                }
            }
        }
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
// acquire network state
app.get('/AcquireNetworkState', function(req, res){
    blockGenerationLogestChain();
    res.json({longestChain: longestBlockChain, forkBranches: forkBranches});
}) 

app.listen(PORT, function() {
    console.log('Server is running on PORT:',PORT);
});
