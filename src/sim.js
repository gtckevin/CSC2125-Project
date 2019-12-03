//Models
var Node = require('../models/nodes');
var Block = require('../models/blockchain');

/*
object need to remember

nodes array
block map (blockId: blockObject)
*/
var nodes = [];
var longestBlockChain = [];
var doubleSpendingChain = [];
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
var defalutHonestOrAttacker = false;
var currentNodeLength = 0;
var latestBlockId = -1;


exports.addNode = function(req) {
    var numberOfNode = parseInt(req.body.numberOfNode);
    var reqHashRate = parseFloat(req.body.hashRate); 
    var reqHonestOrAttacker = req.body.attack;
    console.log(req.body.numberOfNode);
    console.log(numberOfNode);
    var lenOfNodes = nodes.length;

    for(var i = 0; i < numberOfNode; i++) {
        var node = new Node(lenOfNodes + i, longestChain, reqHashRate, reqHonestOrAttacker, -1); // no block yet, set block id to -1
        //console.log(nodeObj);
        //var node = {nodeId:lenOfNodes + i, protocol:longestChain, hashRate:defaultHashRate, honestOrAttacker:defalutHonestOrAttacker};
        nodes.push(node);
    }
    currentNodeLength += numberOfNode;
    console.log(nodes);
    console.log(currentNodeLength);

    return nodes;
}

exports.changeNodeParams = function(req) {
	var reqNodeId = parseInt(req.params.nodeId);
    var reqProtocol = req.body.protocol;
    var reqHashRate = req.body.hashRate;
    var reqHonestOrAttacker = req.body.attack;
    var reqTypeOfAttack = req.body.typeOfAttack; 

    // Attack set to true; mark as attacker
    // if (req.body.attack) {
    //     reqTypeOfAttack = "doubleSpending";
    //     reqHonestOrAttacker = false;
    // }

    var node = nodes[reqNodeId];
    if(node) {  // if the node is not been delete
        //could have getter of setter to do this
        node.protocol = (reqProtocol == null) ? node.protocol : reqProtocol;
        node.hashRate = (reqHashRate == undefined) ? node.hashRate : parseFloat(reqHashRate);
        node.honestOrAttacker = (reqHonestOrAttacker == null) ? node.honestOrAttacker : reqHonestOrAttacker;
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
        return 200;
    } else {

        //debug
        console.log(nodes);
        return 500;
    }
}

exports.deleteNode = function(req) {
	var reqNodeId = parseInt(req.params.nodeId);

    var node = nodes[reqNodeId];
    if(node) {
        nodes[reqNodeId] = null;
        //debug
        console.log(nodes);
        currentNodeLength--;
        return 200;
        
    } else {
        //debug
        console.log(nodes);
        return 500;
    }

    console.log(currentNodeLength);
}

exports.acquireNetworkState = function(req) {
    reduceLatncy();
	blockGenerationLogestChain();
	return {longestChain: longestBlockChain, forkBranches: forkBranches, doubleSpendingChain: doubleSpendingChain};
}

//helper functions
function reduceLatncy() {
    for(var i = 0; i < longestBlockChain.length; i++) {
        if(longestBlockChain[i].latency > 0) {
            longestBlockChain[i].latency--;
        }
    }
    for(var i = forkBranches.length - 1; i >= 0; i--) {
        for(var j = 0; j < forkBranches[i].length; j++) {
            if(forkBranches[i][j].latency > 0) { 
                forkBranches[i][j].latency--;
            } 
        }
    }
    for(var i = 0; i < doubleSpendingChain.length; i++) {
        if(doubleSpendingChain[i].latency > 0) {
            doubleSpendingChain[i].latency--;
        }
    }

}
function blockGenerationLogestChain(){
    //check if we already have fork branch, if so record how many block in fork branch
    var blocksInForkBranches = forkBranches.length;
    var doubleSpendingLength = doubleSpendingChain.length;
    var currentIterForkBranches = [];
    //each node working on POW check if they get a valid block or not
        //first it need to check which branch to work on. 
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i] == null) {
            continue;
        }
        var found = blockGenerationLogestChainHonestHelper(nodes[i]);
        console.log("found: " + found);
        // Now we know if we found an block or not base on different type of protocol add valid block or continue to next node
        if(found) {
            if(nodes[i].honestOrAttacker == false) { //honest node
                addBlockToNetwork(nodes[i], currentIterForkBranches, blocksInForkBranches);
            } else { // attacker node
                //if(nodes[i].typeOfAttack == "doubleSpending") {
                    if(doubleSpendingChain.length == 0) {
                        var attackerBlock = addBlockToNetwork(nodes[i], currentIterForkBranches, blocksInForkBranches);
                        doubleSpendingChain.push(attackerBlock);
                    } else if(doubleSpendingChain.length == doubleSpendingLength) {
                        var newAttackBlock = new Block(latestBlockId + 1, nodes[i].nodeId, nodes[i].acceptPreBlock, nodes[i].latency);
                        doubleSpendingChain.push(newAttackBlock);
                        //currentIterForkBranches.push(newAttackBlock);
                        blockMap.set(latestBlockId + 1, newAttackBlock);
                        latestBlockId += 1;
                    }
                    
                //}
            }
        }

    }
    // now one iterations is done we need to check if we have resolved fork branch or not.
    console.log("currentIterForkBranches: " + currentIterForkBranches);
    console.log("before resolved Longest Chain: " + longestBlockChain);
    console.log("doubleSpendingChain before resolved: " + doubleSpendingChain);
    resolvedLongestChain(blocksInForkBranches, currentIterForkBranches);

    //console.log("doubleSpendingChain after resolved: " + doubleSpendingChain);
    if(doubleSpendingChain.length != doubleSpendingLength) {
        var indexOfDoubleSpendingBlockOnLongestBlock = 0;
        for (var i = 0; i < longestBlockChain.length; i++) {
            if(longestBlockChain[i].blockId == doubleSpendingChain[0].preBlockId) {
                indexOfDoubleSpendingBlockOnLongestBlock = i;
            }
        }
        if(doubleSpendingChain.length > forkBranches.length + (longestBlockChain.length - 1 - indexOfDoubleSpendingBlockOnLongestBlock)) {
            forkBranches = [];
            longestBlockChain = longestBlockChain.slice(0, indexOfDoubleSpendingBlockOnLongestBlock);
            for(var i = 0; i < doubleSpendingChain.length; i++) {
                longestBlockChain.push(doubleSpendingChain[i]);
            }
            console.log("cleaning the double spending Chain")
            doubleSpendingChain = [];
        }
    }
    console.log("doublespendingChain: " + doubleSpendingChain);
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
            if(currentIterForkBranches.length != 0) {
                forkBranches.push(currentIterForkBranches);
            }
            
        }
        
    } else { // Case 2
        // Case 2.1
        if(currentIterForkBranches.length == 1) { 
            if(currentIterForkBranches[0].latency > 0) {
                for(var i = 0; i < forkBranches.length; i++) {
                    for(var j = 0; j < forkBranches[i].length; j++) {
                        if(currentIterForkBranches[0].preBlockId == forkBranches[i][j].blockId) {
                            forkBranches[i].push(currentIterForkBranches[0]);
                        }
                    }
                }
                return; //latency is greater than 0, even we found the block but the chain has not received it yet
            }  
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
            var blockWithLathcyZero = [];
            if(currentIterForkBranches.length != 0) {
                for(var i = 0; i < currentIterForkBranches.length; i++) {
                    if(currentIterForkBranches[i].latency > 0) {
                        for(var i = 0; i < forkBranches.length; i++) {
                            for(var j = 0; j < forkBranches[i].length; j++) {
                                if(currentIterForkBranches[0].preBlockId == forkBranches[i][j].blockId) {
                                    forkBranches[i].push(currentIterForkBranches[0]);
                                }
                            }
                        }
                    } else {
                        blockWithLathcyZero.push(currentIterForkBranches[i]);
                    }
                }
                forkBranches.push(blockWithLathcyZero);
            }
            currentIterForkBranches = [];
        }
    }
}
function resetNodesAcceptPreBlock(needResetBlockId, setToBlockId) {
    for(var i = 0; i < nodes.length; i++) {
        if(nodes[i] == null) {
            continue;
        }
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
        if(nodes[i] != null && nodes[i].blockId == blockId) {
            totalHashRate += nodes[i].hashRate;
        }
    }
    return node.hashRate / totalHashRate;
}

function addBlockToNetwork(node, currentIterForkBranches, blocksInForkBranches) {
    //here we need to check if acceptPreBlock is on the latest block or not? if not we use random base to simualte network between branches
   if(blocksInForkBranches == 0) {
        var updatedAcceptPreBlockId = longestBlockChain[longestBlockChain.length - 1].blockId;
        node.acceptPreBlock = updatedAcceptPreBlockId;
        nodes[node.nodeId].acceptPreBlock = updatedAcceptPreBlockId;
   } else {
    var nodeWorkingOnLatestBlock = false; 
    for(var j = 0; j < forkBranches.length; j++) {
        for(var i = 0; i < forkBranches[j].length; i++) {
            if(node.acceptPreBlock == forkBranches[forkBranches.length - 1][i].blockId) {
                nodeWorkingOnLatestBlock = true;
                break;
            }
        }
    }
    
    console.log("blocksInForkBranches: " + blocksInForkBranches);
    console.log("forkBranch: " + forkBranches);
    console.log("length: " + forkBranches[forkBranches.length - 1].length);
    if(!nodeWorkingOnLatestBlock) {
        //If the block has latency then we should not consider it.
        var foundAcceptIndex = false;
        var updatedIndex;
        //debug
        // console.log("forBranch.length: " + forkBranches.length);
        // for(var j = 0; j < forkBranches.length; j++) {
        //     console.log("level: " + j);
        //     console.log("length : " + forkBranches[j].length);
        //     for(var i = 0; i < forkBranches[j].length; i++) {
        //         console.log("blockId: " + forkBranches[j][i].blockId);
        //         console.log("block latency: " + forkBranches[j][i].latency);
        //     }
        // }
        var levelHasLatencyZero = 0;
        var foundLevelHasLatencyZero = false;
        while(!foundAcceptIndex) {
            //console.log("here1");
            // we need to find a level has block latency is 0
            for(var j = forkBranches.length - 1; j >= 0; j--) {
                for(var i = 0; i < forkBranches[j].length; i++) {
                    if(forkBranches[j][i].latency == 0) {
                        foundLevelHasLatencyZero = true;
                        levelHasLatencyZero = j;
                        break;
                    }
                }
                if(foundLevelHasLatencyZero) {
                    break;
                }
            }
            if(foundLevelHasLatencyZero) {
                updatedIndex = Math.floor((Math.random() * (forkBranches[levelHasLatencyZero].length)));
                //console.log("updateIndex: " + updatedIndex);
                if(forkBranches[forkBranches.length - 1][updatedIndex].latency == 0) {
                    foundAcceptIndex = true;
                } 
            } else {
                break;
            }
        }

        if(foundLevelHasLatencyZero) {
            node.acceptPreBlock = forkBranches[forkBranches.length - 1][updatedIndex].blockId;
            nodes[node.nodeId].acceptPreBlock = forkBranches[forkBranches.length - 1][updatedIndex].blockId;
        } else {
            var updatedAcceptPreBlockId = longestBlockChain[longestBlockChain.length - 1].blockId;
            node.acceptPreBlock = updatedAcceptPreBlockId;
            nodes[node.nodeId].acceptPreBlock = updatedAcceptPreBlockId;
        }   
    }
   }

    var validBlock = new Block(latestBlockId + 1, node.nodeId, node.acceptPreBlock, node.latency);
    console.log("validBlock latency: " + validBlock.latency)
    var perBlock = blockMap.get(node.acceptPreBlock);
    nodes[node.nodeId].acceptPreBlock = latestBlockId + 1; // update the nodeID
    blockMap.set(latestBlockId + 1, validBlock);  // add the new block to block map
    perBlock.nextBlocks.push(validBlock);       // push the current block on to the block map

    currentIterForkBranches.push(validBlock); // push all the found block in forkBranches
    latestBlockId += 1;
    return validBlock;
}