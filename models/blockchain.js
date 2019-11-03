class Block {

    constructor(blockId, ownerNodeId, preBlockId) {
        this.blockId = blockId;
        this.preBlockId = preBlockId;
        this.ownerNodeId = ownerNodeId;
        this.nextBlocks = [];
    }
    //Todo could add function for Object 
}

module.exports = Block;