const buildingArtCanonicalRadius=Object.freeze({hq:40,power:26,refinery:33,factory:36,turret:22});
const buildingArtGeometry=Object.freeze([
  Object.freeze(["poly",Object.freeze([-40.0,-18.0,-28.0,-18.0,-28.0,-35.0,28.0,-35.0,28.0,-18.0,40.0,-18.0,40.0,27.0,23.0,27.0,23.0,38.0,-23.0,38.0,-23.0,27.0,-40.0,27.0])]),
  Object.freeze(["poly",Object.freeze([-25.0,-18.0,-18.0,-25.0,18.0,-25.0,25.0,-18.0,25.0,21.0,19.0,25.0,-19.0,25.0,-25.0,21.0])]),
  Object.freeze(["circle",Object.freeze([-12.0,-10.0,8.0])]),
  Object.freeze(["circle",Object.freeze([12.0,-10.0,8.0])]),
  Object.freeze(["circle",Object.freeze([-12.0,-10.0,4.0])]),
  Object.freeze(["circle",Object.freeze([12.0,-10.0,4.0])]),
  Object.freeze(["poly",Object.freeze([0.0,-5.0,8.0,-5.0,2.0,3.0,8.0,3.0,-4.0,17.0,-1.0,7.0,-7.0,7.0])]),
  Object.freeze(["poly",Object.freeze([-31.0,-23.0,-24.0,-30.0,22.0,-30.0,31.0,-21.0,31.0,25.0,15.0,25.0,15.0,32.0,-20.0,32.0,-20.0,25.0,-31.0,25.0])]),
  Object.freeze(["circle",Object.freeze([-12.0,-7.0,15.0])]),
  Object.freeze(["circle",Object.freeze([-12.0,-9.0,12.0])]),
  Object.freeze(["circle",Object.freeze([-12.0,-9.0,5.0])]),
  Object.freeze(["poly",Object.freeze([7.0,-20.0,26.0,-20.0,26.0,8.0,20.0,15.0,7.0,8.0])]),
  Object.freeze(["poly",Object.freeze([11.0,-14.0,18.0,-14.0,21.0,-8.0,15.0,-5.0,11.0,-9.0])]),
  Object.freeze(["poly",Object.freeze([-35.0,-25.0,-21.0,-34.0,-12.0,-26.0,2.0,-34.0,11.0,-26.0,25.0,-34.0,35.0,-25.0,35.0,31.0,-35.0,31.0])]),
  Object.freeze(["poly",Object.freeze([-30.0,-23.0,-21.0,-29.0,-12.0,-23.0,2.0,-29.0,11.0,-23.0,25.0,-29.0,31.0,-23.0,31.0,10.0,-30.0,10.0])]),
  Object.freeze(["poly",Object.freeze([-22.0,-12.0,-12.0,-22.0,12.0,-22.0,22.0,-12.0,22.0,12.0,12.0,22.0,-12.0,22.0,-22.0,12.0])]),
  Object.freeze(["poly",Object.freeze([-19.0,-10.0,-10.0,-19.0,10.0,-19.0,19.0,-10.0,19.0,10.0,10.0,19.0,-10.0,19.0,-19.0,10.0])]),
  Object.freeze(["circle",Object.freeze([0.0,0.0,15.0])]),
  Object.freeze(["circle",Object.freeze([0.0,0.0,12.0])]),
  Object.freeze(["poly",Object.freeze([0,0,6,2,0,4])])
]);
const buildingArtRecipes=Object.freeze({
  hq:Object.freeze([Object.freeze(["path",0,"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([-38.0,-16.0,76.0,39.0]),"#75977c","#a66755"]),Object.freeze(["rect",Object.freeze([-26.0,-33.0,52.0,53.0]),"#566a59","#8b5d4f"]),Object.freeze(["rect",Object.freeze([-23.0,-30.0,46.0,4.0]),"#84917a","#b58d73"]),Object.freeze(["rect",Object.freeze([-20.0,-19.0,40.0,30.0]),"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([-17.0,-15.0,34.0,6.0]),"#9ab9a5","#9ab9a5"]),Object.freeze(["rect",Object.freeze([-8.0,12.0,16.0,24.0]),"#566a59","#8b5d4f"]),Object.freeze(["rect",Object.freeze([-8.0,12.0,16.0,3.0]),"#84917a","#b58d73"]),Object.freeze(["rect",Object.freeze([-34.0,-9.0,7.0,17.0]),"#a4b49a","#c19c86"]),Object.freeze(["rect",Object.freeze([27.0,-9.0,7.0,17.0]),"#a4b49a","#c19c86"])]),
  power:Object.freeze([Object.freeze(["path",1,"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([-22.0,-21.0,44.0,42.0]),"#75977c","#a66755"]),Object.freeze(["rect",Object.freeze([-21.0,-20.0,18.0,34.0]),"#566a59","#8b5d4f"]),Object.freeze(["rect",Object.freeze([3.0,-20.0,18.0,34.0]),"#566a59","#8b5d4f"]),Object.freeze(["path",2,"#84917a","#b58d73"]),Object.freeze(["path",3,"#84917a","#b58d73"]),Object.freeze(["path",4,"#263a30","#44322d"]),Object.freeze(["path",5,"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([-20.0,7.0,40.0,9.0]),"#263a30","#44322d"]),Object.freeze(["path",6,"#d3bd7d","#d3bd7d"])]),
  refinery:Object.freeze([Object.freeze(["path",7,"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([-28.0,-25.0,56.0,47.0]),"#75977c","#a66755"]),Object.freeze(["path",8,"#566a59","#8b5d4f"]),Object.freeze(["path",9,"#84917a","#b58d73"]),Object.freeze(["path",10,"#566a59","#8b5d4f"]),Object.freeze(["path",11,"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([10.0,-16.0,13.0,20.0]),"#b6a16d","#b6a16d"]),Object.freeze(["path",12,"#d1bb7d","#d1bb7d"]),Object.freeze(["rect",Object.freeze([-23.0,17.0,45.0,5.0]),"#566a59","#8b5d4f"]),Object.freeze(["rect",Object.freeze([-16.0,23.0,29.0,7.0]),"#263a30","#44322d"])]),
  factory:Object.freeze([Object.freeze(["path",13,"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([-32.0,-23.0,64.0,51.0]),"#75977c","#a66755"]),Object.freeze(["path",14,"#566a59","#8b5d4f"]),Object.freeze(["rect",Object.freeze([-28.0,-18.0,56.0,3.0]),"#84917a","#b58d73"]),Object.freeze(["rect",Object.freeze([-27.0,-10.0,3.0,19.0]),"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([-7.0,-10.0,3.0,19.0]),"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([13.0,-10.0,3.0,19.0]),"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([-24.0,13.0,48.0,15.0]),"#263a30","#44322d"]),Object.freeze(["rect",Object.freeze([-20.0,16.0,40.0,3.0]),"#84917a","#b58d73"]),Object.freeze(["rect",Object.freeze([-22.0,25.0,44.0,4.0]),"#566a59","#8b5d4f"])]),
  turret:Object.freeze([Object.freeze(["path",15,"#263a30","#44322d"]),Object.freeze(["path",16,"#75977c","#a66755"]),Object.freeze(["rect",Object.freeze([-10.0,-17.0,20.0,3.0]),"#a4b49a","#c19c86"]),Object.freeze(["path",17,"#566a59","#8b5d4f"]),Object.freeze(["path",18,"#263a30","#44322d"])])
});
export { buildingArtCanonicalRadius, buildingArtGeometry, buildingArtRecipes };
