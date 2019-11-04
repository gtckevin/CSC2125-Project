"use strict";

var timesteps = [];

var paramHeader;
var tempNode = null;

$(document).ready(function() {
	paramHeader = $('.param-title');

	// Add interactions to nodes:
	$('.node').draggable ({
		containment: ".right-pane"
	});

	// Add a temporary node at the clicked location:
	$('.right-pane').dblclick(function(e) {
		if ($(e.target).hasClass('node')) {
			// Delete this node
			deleteNode($(e.target).attr('id'));
			return;
		}

		renderNewNode(e.pageX, e.pageY);
		displayNewNodeParams();
	})

	// If the node hasn't been added yet, delete the temporary node 
	$('.right-pane').mousedown(function(e) {
		// Clicked on the temporary node:
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

	// Debugging:
	$(document).on('keypress', function(e) {
		if (e.which == 122) {
			addNode();
		}
		if (e.which == 120) {
			fetchState();
		}
		if (e.which == 99) {
		}
	})
	
})

function displayNewNodeParams() {
	$('.selected').removeClass('selected');
	changeParamHeader("Add a Node", "temp-title");
}

function displayNodeParams(id) {
	$('.selected').removeClass('selected');
	changeParamHeader("Node " + id, "node-title");

	// Highlight target
	$('#node-' + id).addClass("selected");
}

function displayNetworkParams() {
	$('.selected').removeClass('selected');
	changeParamHeader("Network", "network-title");
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

function renderNewNode(x, y) {
	if (tempNode) {
		deleteTemporaryNode();
	}

	tempNode = $('<div id="temp-node">')
		.css({
			"left": x - $('.main-container').offset().left - 25 + 'px',
			"top": y - $('.main-container').offset().top - 25 + 'px'
		})
		.appendTo($('.right-pane'));
}

function deleteTemporaryNode() {
	if (tempNode) {
		// Remove the node itself
		$(tempNode).remove();
		tempNode = null;

		displayNetworkParams();
	}
}

// Bundle and send network and node parameters
function initNetworkParams(networkParams, nodes) {

}

// GET request to /modify_network
function changeNetworkParams(params) {

}

// GET request to /modify_node
function changeNodeParams(nodeId, params) {

}

// GET request to /refresh
function fetchState() {
	$.ajax({
		url: '/refresh',
		type: 'GET',
		dataType: 'json',
		success: function(res) {
			console.log(res);

			// Update state to include this next time step
			timesteps.push(res);
		}
	})
}

// GET request to /delete
function deleteNode(id) {
	console.log("delete: " + id);

	$.ajax({
		url: '/delete?' + $.param({
			"nodeId": id.split('-')[1]
		}),
		type: 'GET',
		dataType: 'text',
		success: function(res) {
			$("#" + id).remove();
			displayNetworkParams();
		}
	})
}

// GET request to /add
function addNode() {
	$.ajax({
		url: '/add?' + $.param({
			"numberOfNode": 1
		}),
		type: 'GET',
		dataTyle: 'text',
		success: function(res) {
			var newNode = res[res.length - 1];

			// Update the temporary node so we don't delete it:
			tempNode.prop('id', 'node-' + newNode.nodeId);

			tempNode.addClass("node");
			tempNode.addClass("selected");

			tempNode.click(function() {
				displayNodeParams(newNode.nodeId);
			})

			tempNode.draggable({
				containment: ".right-pane"
			});

			tempNode = null;
			displayNodeParams(newNode.nodeId);
		}
	})
}