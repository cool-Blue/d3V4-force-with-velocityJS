#  d3 Force directed graph with node size transitions - velocity.js  

----------  


## Key points

 1. Charge set to 0, friction set to 0.9
 2. Schedule parallel transitions on the radius and line in the timer callback
 4. Use the dynamic radius for calculating collisions
 6. Use a transform on the nodes (g element) to decouple text and line positioning from node position, adjust the transform x and y, only in the tick callback
 7. Remove the CSS transitions and add d3 transitions so that you can synchronise everything
 8. changed this `r = d.rt + 10` to this `r = d.rt + rmax` in the collision function to tighten up the control on overlaps
 9. Closed loop speed regulator.  Even though friction  is set to 0.9 to dampen movement, the speed regulator will keep them moving
 10. Use parallel transitions to coordinate geometry changes
 11. Added a small amount of gravity
 12. The % errors between line positions and the changing radius are zero to three decimal places

[Pure d3 version](http://bl.ocks.org/cool-Blue/019307194abe050e1117)  
[Attempt at CSS version](http://bl.ocks.org/cool-Blue/f810911f5f84b94f2e3e)  

----------  

