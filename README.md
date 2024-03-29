# Blockchain Consensus Visualizer
## Instructions
* Add a node: double-click anywhere on the visualization pane (the giant empty space on the right)
* View node parameters: click on a node
* Delete a node: double-click a node
* Update parameter values: change the input field, hit save
* Run the visualization: press the play button in the bottom-right
	* This will automatically call `initNetworkParams()` the first time it's run

## Updates
### Nov. 10, 2019
#### Front-end Changes
* Added ability to play/pause the visualization
* Added timeline slider
	* State at each timestep is currently saved and can be viewed (`console.log(timesteps)`), but visual changes to nodes can't be seen
	* Parameter changes at each timestep is visible in the left pane
* Added support for changing node colours
	* At the moment, every new node just gets assigned a randomly-generated colour; colour means nothing at the moment
* Changed style of nodes (square to circles, added shadow and border to selected nodes)

##### To-do
* _Add support for dropdown parameter values (e.g. network protocol)_
* Apply colour change to nodes based on consensus at each timestep
* Figure out what to do in the case where you've deleted a node that would've been at a certain timestep when viewing the history
* Keep track of the colour of nodes at different timesteps

### Nov. 9, 2019
#### API Changes
* addNode: `GET /add` => `POST /nodes`
* deleteNode: `GET /delete` => `DELETE /nodes/:nodeId` 
* acquireNetworkState: `GET /refresh` => `GET /network`
* changeNodeParams: added `PUT /nodes/:nodeId`
* changeNetworkParams: added `PUT /network`
* getNodeInfo: added `GET /nodes/:nodeId`
	* We might not actually need this at all, but the route is here anyway
	* Doesn't actually do anything at the moment
* initNetworkParams: added `POST /network`
	* Back-end support for this needs to be added
	* You may assume it will only be run once, but you may not assume anything about nodes being added/removed/modified beforehand
	* You may also assume `changeNetworkParams()` will not be called until after this is called
	* Please check `routes.js` for information about what to expect in the request

`sim.js` has been updated to support these changes (e.g. req.query.x is now req.body.x for anything that turned into a POST/PUT request.)

#### Front-end Changes
* Made it possible to actually do stuff without relying on debug commands
* Added fields to change parameter values in the left pane
* Added support for changing network/node parameters
* Implemented latency and visualization speed (though there's no interface to modify visualization speed at the moment)
* Added a play/pause button (it works!)
	* Calls `fetchState()` every second (which calls `acquireNetworkState()`) and prints the response to console
	* Displays the current timestamp

##### To-do
* Add support for dropdown parameter values (e.g. network protocol)
* Visualize changes at each timestamp; the visualizer currently supports saving updates from each `acquireNetworkState()` call, but doesn't do anything with that data
* Add the timeline/a way to view the history

