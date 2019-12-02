class Node {
    constructor(nodeId, protocol, hashRate, honestOrAttacker, acceptPreBlock) {
        this.nodeId = nodeId;
        this.protocol = protocol;
        this.hashRate = hashRate;
        this.honestOrAttacker = honestOrAttacker;
        this.acceptPreBlock = acceptPreBlock;
        this.latency = 0;
        this.typeOfAttack = null;
    }
    //Todo could add function for Object 

}

module.exports = Node;
