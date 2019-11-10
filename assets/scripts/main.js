"use strict";

var timesteps = [];
var tempNode = null;

var paramHeader;
var paramList;

var initNetwork = false;

var playEnabled = false;
var playIcon = "play_arrow";
var pauseIcon = "pause";

var latency = 0;
var latencyCounter = 0; // only do things when latencyCounter reaches 0, then reset back to latency
var maxTimestep = 0;

var visTimer;
var defaultRefreshRate = 1000;      // default: one update per second

// networkParams = [[name, id, inputVal, inputType, enabled], [], ...]
// Specify default values by modifying networkParams[i][2]
var networkParams = [
    ["Protocol", "protocol", "Longest Chain", "dropdown", true],
    ["Default Node Hash Rate", "defaultHashRate", 10, "text", true],
    ["Network Latency", "networkLatency", 0, "text", true],
    ["Bandwidth", "bandwidth", 0, "text", true],
    ["Block Size", "blockSize", 0, "text", true],
    ["Generation Time", "blockGenerationTime", 0, "text", true]
];

// nodeParams = { "nodeId": [[name, id, inputVal, inputType, enabled], ...], ...}
var nodeParams = {};
var tempNodeParams = [
    ["Attack", "attack", "None", "dropdown", true],
    ["Hash Rate", "hashRate", networkParams[1][2], "text", true],
    ["Latency", "latency", 0, "text", true]
];

// Start with network parameters by default:
var currParamList = networkParams;

$(document).ready(function() {
    paramHeader = $('.param-title');
    paramList = $('.param-container');

    $("#playBtn").click(function () {
        togglePlay();
    });

    // Start by showing network parameters:
    displayNetworkParams();

    // Add interactions to nodes:
    $('.node').draggable ({
        containment: ".vis"
    });

    // Add a temporary node at the clicked location:
    $('.vis').dblclick(function(e) {
        if ($(e.target).hasClass('node')) {
            // Delete this node
            deleteNode($(e.target).attr('id'));
            return;
        }

        renderNewNode(e.pageX, e.pageY);
        displayNewNodeParams();
    })

    // If the node hasn't been added yet, delete the temporary node 
    $('.vis').mousedown(function(e) {
        if (tempNode && $(e.target).attr('id') == tempNode.attr('id')) {
            return;
        } else {
            deleteTemporaryNode();

            if ($(e.target).hasClass('node')) {
                displayNodeParams($(e.target).attr('id').split('-')[1]);
            } else {
                displayNetworkParams();
            }
        }
    })
    
    // Call fetchState every few seconds (defined by defaultRefreshRate)
    visTimer = setInterval(fetchState, defaultRefreshRate)

    // Debugging:
    $(document).on('keypress', function(e) {
        if (e.which == 122) {
            
        }
        if (e.which == 120) {
            
        }
        if (e.which == 99) {
            
        }
    })
})


/***************************
*       PARAMETERS         *
***************************/
function clearParamList() {
    $(paramList).empty();
}

function changeParamHeader(title, c) {
    var classes = ["node-title", "temp-title", "network-title"];
    for (var i in classes) {
        if (classes[i] != c) {
            paramHeader.removeClass(classes[i]);
        } else {
            paramHeader.addClass(c);
        }
    }   

    paramHeader.text(title);
}

function addParamsFromList(l) {
    for (var i = 0; i < l.length; i++) {
        addParamListItem(l[i][0], l[i][1], l[i][2], l[i][3], l[i][4]);
    }
}

// inputType = text, dropdown
function addParamListItem(name, id, inputVal, inputType, enabled) {
    var item = $('<div class="param-item">').appendTo(paramList);
    var paramLeft = $('<div class="param-left">').appendTo(item);
    paramLeft.text(name);

    var paramRight = $('<div class="param-right">').appendTo(item);

    switch(inputType) {
        case "text":
            $('<input type="number" class="input-text" id="' + id + '" value="' + inputVal + '">')
                .appendTo(paramRight)
                .prop('disabled', !enabled);
            break;

        case "dropdown":
            break;
    }
}

function setParamValById(paramList, id, val) {
    for (var i = 0; i < paramList.length; i++) {
        if (paramList[i][1] == id) {
            paramList[i][2] = val;
        }
    }
}

function getParamValById(paramList, id) {
    for (var i = 0; i < paramList.length; i++) {
        if (paramList[i][1] == id) {
            return paramList[i][2];
        }
    }
}

function setParamEnabled(paramList, id, enabled) {
    for (var i = 0; i < paramList.length; i++) {
        if (paramList[i][1] == id) {
            paramList[i][4] = enabled;
        }
    }
}

function displayNewNodeParams() {
    $('.selected').removeClass('selected');
    changeParamHeader("Add a Node", "temp-title");

    clearParamList();
    addParamsFromList(tempNodeParams);

    // Button to reset parameters
    var saveButton = $('<div class="param-btn save">')
        .appendTo(paramList)
        .click(addNode);

    saveButton.text("Add Node");
}

function displayNodeParams(id) {
    $('.selected').removeClass('selected');
    changeParamHeader("Node " + id, "node-title");

    // Highlight target
    $('#node-' + id).addClass("selected");

    clearParamList();
    addParamsFromList(nodeParams[id]);
    // Button to reset to default

    // Button to submit changes
    var saveButton = $('<div class="param-btn save">')
        .appendTo(paramList)
        .click(function() {
            // Update networkParams
            for (var i = 0; i < nodeParams[id].length; i++) {
                nodeParams[id][i][2] = $('#' + nodeParams[id][i][1]).val();
            }

            changeNodeParams(id);
        });

    saveButton.text("Save Changes");
}

function displayNetworkParams() {
    $('.selected').removeClass('selected');
    changeParamHeader("Network", "network-title");

    clearParamList();
    addParamsFromList(networkParams);

    var saveButton = $('<div class="param-btn save">')
        .appendTo(paramList)
        .click(function() {
            // Update networkParams
            for (var i = 0; i < networkParams.length; i++) {
                networkParams[i][2] = $('#' + networkParams[i][1]).val();

                switch (networkParams[i][1]) {
                    case "defaultHashRate":
                        setParamValById(tempNodeParams, "hashRate", networkParams[i][2]);
                        break;
                    case "networkLatency":
                        latency = networkParams[i][2];
                        break;
                    default:
                        break;
                }
            }

            if (initNetwork) {
                changeNetworkParams();
            }
        });

    saveButton.text("Save Changes");
}


/***************************
*         NODES            *
***************************/
function renderNewNode(x, y) {
    if (tempNode) {
        deleteTemporaryNode();
    }

    tempNode = $('<div id="temp-node">')
        .css({
            "left": x - $('.main-container').offset().left - 25 + 'px',
            "top": y - $('.main-container').offset().top - 25 + 'px'
        })
        .appendTo($('.vis'));
}

function deleteTemporaryNode() {
    if (tempNode) {
        // Remove the node itself
        $(tempNode).remove();
        tempNode = null;

        displayNetworkParams();
    }
}

// POST /nodes
function addNode() {
    var data = {"numberOfNode": 1};
    for (var i = 0; i < tempNodeParams.length; i++) {
        data[tempNodeParams[i][1]] = $('#' + tempNodeParams[i][1]).val();
    }

    $.ajax({
        url: '/nodes',
        type: 'POST',
        dataType: 'text',
        contentType: 'application/json',
        data: JSON.stringify(data)
    })
    .done(function(res) {
        console.log("Add node success: " + res);
        var nodes = JSON.parse(res);
        var newNode = nodes[nodes.length - 1];

        // Add param values to the nodeParam list:
        var newParams = [];

        for (var i = 0; i < tempNodeParams.length; i++) {
            newParams.push([tempNodeParams[i][0], tempNodeParams[i][1], $('#' + tempNodeParams[i][1]).val(), tempNodeParams[i][3], tempNodeParams[i][4]]);
        }

        nodeParams[newNode.nodeId] = newParams;

        // Turn the temporary node into a permanent one:
        tempNode.prop('id', 'node-' + newNode.nodeId);

        tempNode.addClass("node");
        tempNode.addClass("selected");

        tempNode.click(function() {
            displayNodeParams(newNode.nodeId);
        })

        tempNode.draggable({
            containment: ".vis"
        });

        tempNode = null;

        // Switch left pane to show the new node's parameters:
        displayNodeParams(newNode.nodeId);
    })
    .fail(function(jqXHR, textStatus) {
        console.log("Add node failed: " + textStatus);
    });
}

// DELETE /nodes/id
function deleteNode(id) {
    console.log("Delete node " + id);

    $.ajax({
        url: '/nodes/' + id.split("-")[1],
        type: 'DELETE',
        success: function(res) {
            $("#" + id).remove();
            displayNetworkParams();
        }
    });    
}

// PUT /nodes/id
function changeNodeParams(nodeId) {
    var data = {};
    for (var i = 0; i < nodeParams[nodeId].length; i++) {
        data[nodeParams[nodeId][i][1]] = $('#' + nodeParams[nodeId][i][1]).val();
    }

    $.ajax({
        url: '/nodes/' + nodeId,
        type: 'PUT',
        dataType: 'text',
        contentType: 'application/json',
        data: JSON.stringify(data)
    })
    .done(function(res) {
        console.log("Update node success: " + res);
    })
    .fail(function(jqXHR, textStatus) {
        console.log("Update node failed: " + textStatus);
    });
}

/***************************
*         NETWORK          *
***************************/
// POST /network
// Bundle and send network and node parameters
function initNetworkParams() {
    var data = {};

    for (var i = 0; i < networkParams.length; i++) {
        data[networkParams[i][1]] = networkParams[i][2];

        if (networkParams[i][1] == "protocol" && networkParams[i][2] == "Longest Chain") {
            data["protocol"] = "longestChain";
        }
    }

    console.log(JSON.stringify(data));

    $.ajax({
        url: '/network',
        type: 'POST',
        dataType: 'text',
        contentType: 'application/json',
        data: JSON.stringify(data)
    })
    .done(function(res) {
        console.log("Init success: " + res);

        // Disable some parameter fields
        setParamEnabled(networkParams, "protocol", false);
        setParamEnabled(networkParams, "nodeCount", false);

        initNetwork = true;
    })
    .fail(function(jqXHR, textStatus) {
        console.log("Init failed: " + textStatus);
    });
}

// GET /network
function fetchState() {
    if (playEnabled) {
        if (!initNetwork) {
            initNetworkParams();
            return;
        }

        // Simulate latency
        if (latencyCounter == 0) {
            latencyCounter = latency;

            $.ajax({
                url: '/network',
                type: 'GET',
                dataType: 'json'
            })
            .done(function(res) {
                console.log(res);

                // Update state to include this next time step
                timesteps.push(res);
            })
            .fail(function(jqXHR, textStatus) {
                console.log("Init failed: " + textStatus);
            });
        } else {
            latencyCounter--;
        }

        maxTimestep++;
        $('.timeline-container').text("Time: " + maxTimestep);
    }
}

// PUT /network
function changeNetworkParams() {
    var data = {};
    for (var i = 0; i < networkParams.length; i++) {
        data[networkParams[i][1]] = $('#' + networkParams[i][1]).val();
    }

    // todo: update these
    // Temporarily add these values, since sim.js is relying on them:
    req.body.honestOrAttacker;
    var reqTypeOfAttack = req.body.typeOfAttack; 

    data["typeOfAttack"] = "";
    data["honestOrAttacker"] = true;

    $.ajax({
        url: '/network',
        type: 'PUT',
        dataType: 'text',
        contentType: 'application/json',
        data: JSON.stringify(data)
    })
    .done(function(res) {
        console.log("Update network success: " + res);
    })
    .fail(function(jqXHR, textStatus) {
        console.log("Update network failed: " + textStatus);
    });
}

/***************************
*  VISUALIZATION SETTINGS  *
****************************/
function togglePlay() {
    playEnabled = !playEnabled;
    console.log(playEnabled);

    if (playEnabled) {
        $("#playBtn").html(pauseIcon);
    } else {
        $("#playBtn").html(playIcon);
    }
}

function changeVisSpeed(time) {
    clearInterval(visTimer);
    visTimer = setInterval(fetchState, time);
}