class Block {

    constructor(blockId, ownerNodeId, preBlockId, latency) {
        this.blockId = blockId;
        this.preBlockId = preBlockId;
        this.ownerNodeId = ownerNodeId;
        this.timestamp = Math.floor(Date.now() / 1000);
        this.latency = latency;
        this.nextBlocks = [];
    }
    //Todo could add function for Object 
}

module.exports = Block;