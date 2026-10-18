// Draw-only art pilot: geometry is replayed into SVG by the proof tool.
// No simulation fields, RNG, caches or separate turret rotation are introduced.
function unitArtPoly(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)ctx.lineTo(points[i],points[i+1]);ctx.closePath();ctx.fill()}
function drawUnit(e){
  let phase=unitTrackPhase(e),r=e.r,color=e.team?'#a66755':'#75977c',high=e.team?'#d19b7e':'#a4b49a',dark=e.team?'#6f4038':'#405c49';
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);
  rect(-r+2,-r+4,r*2,r*2,'#0d211680');
  if(e.type==='scout'){
    for(let x of[-8,3])for(let y of[-10,6])rect(x,y,6,4,'#17231d');
    unitArtPoly([-9,-6,4,-7,10,-3,10,3,4,7,-9,6],'#17271e');
    unitArtPoly([-8,-5,4,-6,9,-2,9,2,4,6,-8,5],color);
    rect(-6,-5,7,2,high);rect(-3,-3,7,6,dark);rect(2,-1.5,15,3,'#c0c7a3');
  }else{
    rect(-r,-r,r*2,5,'#202c24');rect(-r,r-5,r*2,5,'#202c24');
    for(let x=-r-7+phase;x<r;x+=7){let left=Math.max(-r,x),right=Math.min(r,x+2);if(right>left){rect(left,-r,right-left,4,'#687361');rect(left,r-4,right-left,4,'#687361')}}
    if(e.type==='tank'){
      unitArtPoly([-13,-8,7,-8,13,-4,13,4,7,8,-13,8],'#17271e');
      unitArtPoly([-12,-7,7,-7,12,-3,12,3,7,7,-12,7],color);
      rect(-10,-7,14,2,high);unitArtPoly([-6,-6,4,-6,8,-2,8,3,3,6,-6,5],dark);
      rect(-4,-5,7,2,high);rect(3,-2,21,4,'#c0c7a3');rect(20,-2.5,4,5,dark);
    }else if(e.type==='artillery'){
      unitArtPoly([-14,-9,9,-9,14,-5,14,5,9,9,-14,9],'#17271e');
      unitArtPoly([-13,-8,9,-8,13,-4,13,4,9,8,-13,8],color);
      rect(-11,-8,14,2,high);rect(-12,-7,12,14,dark);rect(-9,-5,7,10,high);
      rect(-2,-2.5,36,5,'#c0c7a3');rect(29,-3.5,5,7,dark);
    }else if(e.type==='repair'){
      unitArtPoly([-13,-8,5,-8,13,-4,13,5,6,8,-13,8],'#17271e');
      unitArtPoly([-12,-7,5,-7,12,-3,12,4,6,7,-12,7],color);
      rect(-10,-7,15,14,'#b4c5ab');rect(7,-3,4,6,dark);
      unitArtPoly([-1,-6,1,-4,4,-6,5,-2,2,1,-2,6,-5,4,-1,0,-3,-2],dark);
      rect(-10,8,13,2,'#d9bd77');rect(3,6,3,4,'#d9bd77');
    }else if(e.type==='harvester'){
      rect(-15,-10,23,20,color);rect(-13,-8,17,16,dark);rect(-12,-7,15,2,high);
      rect(-10,-3,5,6,'#b59b60');rect(-4,-5,6,9,'#d0b16f');rect(8,-10,7,20,'#c6ab6b');
      rect(10,-10,1,20,'#524f38');rect(13,-10,1,20,'#524f38');
      rect(-11,8,Math.max(1,e.load/180*20),3,'#e9c55f');
    }
  }
  // Small rear-corner team stencil; leave the role-defining hull detail visible.
  // Secondary cue may weaken at half-scale; never enlarge the collision footprint.
  let badgeX=-r+2,badgeY=-r+5;rect(badgeX-1,badgeY-1,8,6,'#14201b');
  if(e.team)unitArtPoly([badgeX,badgeY,badgeX+6,badgeY+2,badgeX,badgeY+4],'#e7d9b4');
  else{rect(badgeX,badgeY,6,1.5,'#e7d9b4');rect(badgeX,badgeY+2.5,6,1.5,'#e7d9b4')}
  ctx.restore();
}
