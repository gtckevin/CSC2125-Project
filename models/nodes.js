class Node {
    constructor(nodeId, protocol, hashRate, honestOrAttacker, acceptPreBlock, latency) {
        this.nodeId = nodeId;
        this.protocol = protocol;
        this.hashRate = hashRate;
        this.honestOrAttacker = honestOrAttacker;
        this.acceptPreBlock = acceptPreBlock;
        this.latency = latency;
        this.typeOfAttack = null;
    }
    //Todo could add function for Object 

}

module.exports = Node;
