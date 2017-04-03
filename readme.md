#  d3 Force directed graph with node size transitions - velocity.js  

----------  


## Key points

 1. Using d3 v4 modules on an as needed basis with ES6 modules
 1. Uses an outer and an inner force simulation, the former for the groups
 1. Using standard d3 collide function with strength and iteration set to 1 (iteration of 3 is about the same)
 1. Using forceX and forceY to cluster the nodes, no many body force used
 1. Driving the animation from Velocity tick using a progress callback on a dummy, zero-length transition
 2. Using promise + recursion to chain radius (breath) transitions with lines adjusted on progress cb
 4. Use the dynamic radius for calculating collisions
 6. Use a transform on the nodes (g element) to decouple text and line positioning from node position, adjust the transform x and y, only in the tick callback
 8. changed this `r = d.rt + 10` to this `r = d.rt + rmax` in the collision function to tighten up the control on overlaps
 9. Closed loop speed regulator keep the nodes moving
 10. Use parallel transitions to coordinate geometry changes
 12. The % errors between line positions and the changing radius are zero to three decimal places

[Pure d3 version](http://bl.ocks.org/cool-Blue/019307194abe050e1117)  
[Attempt at CSS version](http://bl.ocks.org/cool-Blue/f810911f5f84b94f2e3e)  

----------  

## Rendering performance
The objective is to get 60 FPS with room to spare, preferably using SVG elements because they are easier to work with than canvas.  The FPS perf was extremely variable and it was finally realised that this was strongly coupled to zoom level - particularly in chrome.
### Coupling to zoom level
