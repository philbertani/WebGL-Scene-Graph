
const node = function(name,type=0) {
    this.name = name;
    this.children = [];
    this.local = 1;
    this.world = 0;
    this.nodeType = type;
}
node.prototype.addChild = function( node ) {
    this.children.push(node);
}

//////////////////

const solarSystem = new node("solar system");
const sun         = new node("sun")
const earthOrbit  = new node("earth orbit");
const earth       = new node("earth");
const moonOrbit   = new node("moon orbit");
const moon        = new node("moon");
const sphere      = new node("sphere", 1);

solarSystem.addChild(sun);
solarSystem.addChild(earthOrbit);

earthOrbit.addChild(earth);
earth.addChild(moonOrbit);
moonOrbit.addChild(moon);

sun.addChild(sphere);
earth.addChild(sphere);
moon.addChild(sphere);


function dagTraverse(node) {
    console.log(node.name)
    node.children.forEach(child=> dagTraverse(child))
}

dagTraverse(solarSystem)



