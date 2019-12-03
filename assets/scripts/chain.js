var cytoscape = require('cytoscape');
var dagre = require('cytoscape-dagre');
var cy;

$(document).ready(function() {

    cytoscape.use( dagre );
    cy = cytoscape({
        container: document.getElementById('cy'), // container to render in

        style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'label': 'data(id)',
            'shape': 'rectangle'
          }
        },

        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
        ],

        layout: {
            name: 'dagre',
            rankDir: 'LR',
            fit: true
        }
    });

    cy.on('tap', 'node', function(evt){ 
        var owner = evt.target.data("owner");

        // Check if node still exists:
        $('#node-' + owner).trigger("click");
    });

});

function renderViewport(state) {
    console.log(state);

    // Erase the graph:
    cy.remove('node');
    cy.remove('edge');

    addBlocks(state);
}

function addBlocks(state) {
    // Figure out all nodes:
    for (var i = 0; i < state.length; i++) {
        for (var j = 0; j < state[i].length; j++) {
            cy.add([ 
                { 
                    group: 'nodes', 
                    data: { 
                        id: state[i][j]["blockId"],
                        pre: state[i][j]["preBlockId"],
                        owner: state[i][j]["ownerNodeId"]
                    },
                    style: {
                        'background-color': function(ele){ return $('#node-' + state[i][j]["ownerNodeId"]).css("background-color") }
                    }
                } 
            ]);
        }
    }

    // Figure out all edges:
    for (var i = 0; i < state.length; i++) {
        for (var j = 0; j < state[i].length; j++) {
            if (state[i][j]["preBlockId"] >= 0) {
                cy.add([ 
                    { 
                        group: 'edges', 
                        data: { 
                            source: state[i][j]["preBlockId"],
                            target: state[i][j]["blockId"]
                         }
                    } 
                ]);
            }
            
        }
    }

    cy.layout({
        name: 'dagre',
        rankDir: 'LR',
        fit: true, // whether to fit the viewport to the graph
    }).run();
}


function centerViewport() {
    // cy.animate({
    //     fit: {
    //         padding: 20
    //     }
    // }, {
    //     duration: 500
    // })

    cy.fit();
}

function setBlockColour(id, colour) {
    var target = cy.nodes('[id = "' + id + '"]');

    if (target.length != 0) {
        console.log(target);
    }

    cy.$("#n1")
        .css("background-color", colour);
}