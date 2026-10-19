const unitArtCanonicalRadius=Object.freeze({tank:13,scout:10,artillery:14,repair:13,harvester:16});
const unitArtGeometry=Object.freeze([
  Object.freeze([-9,-6,4,-7,10,-3,10,3,4,7,-9,6]),
  Object.freeze([-8,-5,4,-6,9,-2,9,2,4,6,-8,5]),
  Object.freeze([-13,-8,7,-8,13,-4,13,4,7,8,-13,8]),
  Object.freeze([-12,-7,7,-7,12,-3,12,3,7,7,-12,7]),
  Object.freeze([-6,-6,4,-6,8,-2,8,3,3,6,-6,5]),
  Object.freeze([-14,-9,9,-9,14,-5,14,5,9,9,-14,9]),
  Object.freeze([-13,-8,9,-8,13,-4,13,4,9,8,-13,8]),
  Object.freeze([-13,-8,5,-8,13,-4,13,5,6,8,-13,8]),
  Object.freeze([-12,-7,5,-7,12,-3,12,4,6,7,-12,7]),
  Object.freeze([-1,-6,1,-4,4,-6,5,-2,2,1,-2,6,-5,4,-1,0,-3,-2])
]);
export { unitArtCanonicalRadius, unitArtGeometry };
