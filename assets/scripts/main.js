"use strict";

var tempNode = null;

var paramHeader;
var paramList;

var initNetwork = false;

var playEnabled = false;
var playIcon = "play_arrow";
var pauseIcon = "pause";

var latency = 0;
var latencyCounter = 0; // only do things when latencyCounter reaches 0, then reset back to latency

var visTimer;
var defaultRefreshRate = 1000;      // default: one update per second

var timelineSlider;
var inRealtime = true;
var currTimestep = 0;
var maxTimestep = 0;

var currSaveBtn = null;

var nodeColours = [];

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

// [{"time": 0, "networkParams": [], "nodeParams": [], "tempNodeParams": [], "state": []}]
var timesteps = [];

// [{"time": 0, "id": 123}]
var deletedNodes = [];

$(document).ready(function() {
    paramHeader = $('.param-title');
    paramList = $('.param-container');
    timelineSlider = $('#timelineSlider');

    // Initialize timesteps:
    timesteps.push({
        "time": 0,
        "networkParams": JSON.parse(JSON.stringify(networkParams)),
        "nodeParams": JSON.parse(JSON.stringify(nodeParams)),
        "state": []
    })

    $(timelineSlider).on("input", onSliderClick);

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
        if (inRealtime) {
            if ($(e.target).hasClass('node')) {
                // Delete this node
                deleteNode($(e.target).attr('id'));
                return;
            }

            renderNewNode(e.pageX, e.pageY);
            displayNewNodeParams();

            // Pause visualization:
            if (playEnabled) {
                togglePlay();
            }
        } else {
            alert("Can't modify nodes unless in realtime!");
        }
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
            generateNodeColour();
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

    if (c == "node-title") {
        $(paramHeader).css('background-color', $('#node-' + title.split(" ")[1]).css('background-color'));
    } else {
        $(paramHeader).css('background-color', '');
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
            // Automatically set to disabled if we're not operating at max timestep:
            var isDisabled = !enabled || !inRealtime;

            $('<input type="number" class="input-text" id="' + id + '" value="' + inputVal + '">')
                .appendTo(paramRight)
                .prop('disabled', isDisabled);
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
    $(paramList).removeClass("not-exist");
    changeParamHeader("Add a Node", "temp-title");

    clearParamList();
    addParamsFromList(tempNodeParams);

    // Button to reset parameters
    var saveButton = $('<div class="param-btn save">')
        .appendTo(paramList)
        .click(addNode);

    saveButton.text("Add Node");

    currSaveBtn = saveButton;
    if (!inRealtime) {
        currSaveBtn.addClass("inactive");
    }
}

function displayNodeParams(id) {
    $('.selected').removeClass('selected');
    $(paramList).removeClass("not-exist");
    changeParamHeader("Node " + id, "node-title");

    // Highlight target
    $('#node-' + id).addClass("selected");

    clearParamList();

    // Check if this node existed at the current timestamp:
    if (id in timesteps[currTimestep]["nodeParams"]) {
        addParamsFromList(timesteps[currTimestep]["nodeParams"][id]);
    } else {
        var newItem = $('<div class="param-item not-exist">').appendTo(paramList);

        $('<div class="param-not-exist">')
            .appendTo(newItem)
            .text("This node did not exist at time " + currTimestep + ".");

        $(paramList).addClass("not-exist");
        return;
    }

    // Button to submit changes
    var saveButton = $('<div class="param-btn save">')
        .appendTo(paramList)
        .click(function() {
            if (inRealtime) {
                // Update nodeParams
                for (var i = 0; i < nodeParams[id].length; i++) {
                    nodeParams[id][i][2] = $('#' + nodeParams[id][i][1]).val();
                }

                changeNodeParams(id);
            }
        });

    saveButton.text("Save Changes");
    currSaveBtn = saveButton;
    if (!inRealtime) {
        currSaveBtn.addClass("inactive");
    }
}

function displayNetworkParams() {
    $('.selected').removeClass('selected');
    $(paramList).removeClass("not-exist");
    changeParamHeader("Network", "network-title");

    clearParamList();
    addParamsFromList(timesteps[currTimestep]["networkParams"]);

    var saveButton = $('<div class="param-btn save">')
        .appendTo(paramList)
        .click(function() {
            if (inRealtime) {
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
            }
        });

    saveButton.text("Save Changes");

    currSaveBtn = saveButton;
    if (!inRealtime) {
        currSaveBtn.addClass("inactive");
    }
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
    if (inRealtime) {
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

            // Temporarily make a new colour and add it to the node:
            var newColour = generateNodeColour();
            $('#node-' + newNode.nodeId).css("background-color", RGBtoString(newColour));
            tempNode = null;

            // Update node params:
            timesteps[maxTimestep]["nodeParams"] = JSON.parse(JSON.stringify(nodeParams))

            // Switch left pane to show the new node's parameters:
            displayNodeParams(newNode.nodeId);
        })
        .fail(function(jqXHR, textStatus) {
            console.log("Add node failed: " + textStatus);
        });
    }
}

// DELETE /nodes/id
function deleteNode(id) {
    deletedNodes.push({"time": maxTimestep, "id": id.split("-")[1]});

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

    timesteps[maxTimestep]["nodeParams"] = JSON.parse(JSON.stringify(nodeParams))

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
*         COLOURS          *
***************************/
// Source: https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
var golden_ratio_conjugate = 0.618033988749895;
var h = Math.random() * 256;

function generateNodeColour() {
    h += golden_ratio_conjugate;
    h %= 1;

    // Add to list of colours
    nodeColours.push(HSVtoRGB(h, 0.5, 0.95));

    return nodeColours[nodeColours.length - 1];
}

// Source: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function setNodeColour(id, colour) {
    $('#node-' + id).css('background-color', colour);
}

function RGBtoString(c) {
    return '"rgb(' + c["r"] + ',' + c["g"] + ',' + c["b"] + ')"';
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

    // Update timestep:
    timesteps[maxTimestep]["networkParams"] = JSON.parse(JSON.stringify(networkParams));

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

        var newTimestep = {
            "networkParams": JSON.parse(JSON.stringify(networkParams)),
            "nodeParams": JSON.parse(JSON.stringify(nodeParams)),
            "state": null
        };

        // Simulate latency
        if (latencyCounter == 0) {
            latencyCounter = latency;

            $.ajax({
                url: '/network',
                type: 'GET',
                dataType: 'json'
            })
            .done(function(res) {
                // Update state to include this next time step
                newTimestep["state"] = res;
            })
            .fail(function(jqXHR, textStatus) {
                console.log("Init failed: " + textStatus);
            });
        } else {
            latencyCounter--;
        }

        // Update the timeline slider's range
        var currSliderVal = $(timelineSlider).val();

        // Check if matches max time:
        if (currSliderVal == maxTimestep) {
            currSliderVal++;
        }

        // Increment timestep
        maxTimestep++;

        $(timelineSlider).attr("max", maxTimestep);
        $(timelineSlider).val(currSliderVal);

        console.log("Time: " + currSliderVal + "/" + maxTimestep);

        // Add new timestep
        newTimestep["time"] = maxTimestep;
        timesteps.push(newTimestep);

        currTimestep = currSliderVal;
    }
}

// PUT /network
function changeNetworkParams() {
    var data = {};
    for (var i = 0; i < networkParams.length; i++) {
        data[networkParams[i][1]] = $('#' + networkParams[i][1]).val();
    }

    // Update timestep:
    timesteps[maxTimestep]["networkParams"] = JSON.parse(JSON.stringify(networkParams));

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
    // Only enable play when at max timestep?
    if (inRealtime) {
        playEnabled = !playEnabled;

        if (playEnabled) {
            $("#playBtn").html(pauseIcon);
            deleteTemporaryNode();
        } else {
            $("#playBtn").html(playIcon);
        }        
    } else {
        alert("Visualizer can only play in live mode! Move slider to the maximum time value.")
    }
}

function changeVisSpeed(time) {
    clearInterval(visTimer);
    visTimer = setInterval(fetchState, time);
}

function onSliderClick() {
    // Pause the visualization if it's active
    if (playEnabled) {
        togglePlay();
    }

    deleteTemporaryNode();

    currTimestep = $(timelineSlider).val();

    if (currTimestep == $(timelineSlider).attr("max")) {
        inRealtime = true;
        currSaveBtn.removeClass("inactive");
    } else {
        inRealtime = false;
        currSaveBtn.addClass("inactive");
    }

    console.log("Time: " + currTimestep + "/" + maxTimestep);
    console.log("Deleted at this point:");

    var d = getNodesDeletedBefore(currTimestep);
    for (var i = 0; i < d.length; i++) {
        console.log("\t[" + d[i]["time"] + '] node-' + d[i]["id"]);
    }

    // Update parameter list to match info at current timestep
    var headerText = $(paramHeader).text();

    if (headerText.startsWith("Node")) {
        displayNodeParams(headerText.split(" ")[1]);
    } else {
        displayNetworkParams();
    }
}

// Return a list of nodes that were deleted before time
function getNodesDeletedBefore(t) {
    var l = [];

    for (var i = 0; i < deletedNodes.length; i++) {
        if (deletedNodes[i]["time"] > t) {
            return l;
        }

        l.push(deletedNodes[i]);
    }

    return l;
}