import Node from "./dagDef.mjs"
import * as m4 from "./m4.mjs"
import * as webglUtils from "./webgl-utils.mjs"
import * as primitives from "./primitives.mjs"
import * as shaders from "./shaders.mjs"

const canvas = document.querySelector("#canvas");
//webgl automatically does multisampling anti aliasing
const gl = canvas.getContext("webgl2", {antialias:true, alpha:false});

const newNodes = [];
let numNewPlanets = 0;
const rotFuncs = [];

const shaderText = [];
shaderText.push(shaders.vertexScreenLit);    //shader text from template string
shaderText.push(shaders.fragmentScreenLit);

const programInfo = webglUtils.createProgramInfo(gl, shaderText);
const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(
  gl,7,35,21
);

const cubeBufferInfo = primitives.createCubeWithVertexColorsBufferInfo(gl,1);

const solarSystemNode = new Node("solar system");

const sunNode = new Node("sun");
sunNode.localMatrix = m4.scaling(6, 6, 6); // sun at the center
sunNode.drawInfo = {
  uniforms: {
    u_colorOffset: [1.5, 1.5, .7, 1], // yellow
    u_colorMult: [1., 1., 0, 1],
  },
};

const earthOrbitNode = new Node("earth orbit");
earthOrbitNode.localMatrix = m4.translation(110, 0, 0);

const earthNode = new Node("earth");
earthNode.localMatrix = m4.scaling(3, 3, 3);
earthNode.drawInfo = {
  uniforms: {
    u_colorOffset: [0.1, 0.4, 0.7, 1], // blue-green
    u_colorMult: [0.8, 0.6, 0.3, 1],
  },
};

//displace the moon out of the ecliptic
//technically around 5 degrees but let's face it this
//is not a realistic version of the solar system
const moonOrbitPlane = m4.normalize([1,.3,0]);
//the axis of rotation for this plane is above vector rotated around z axis
//by 90 degrees
const moonOrbitAxis = m4.transformPoint(m4.zRotation(Math.PI/2),moonOrbitPlane);
const moonOrbitNode = new Node("moon orbit");
const mT = m4.scaleVector(moonOrbitPlane,30);
//console.log(mT)
moonOrbitNode.localMatrix = m4.translation(mT[0],mT[1],mT[2]); 
const moonNode = new Node("moon");
moonNode.localMatrix = m4.scaling(1.2, 1.2, 1.2);
moonNode.drawInfo = {
  uniforms: {
    u_colorOffset: [0.4, 0.4, 0.4, 1], // gray
    u_colorMult: [0.3, 0.3, 0.3, 1],
  },
};

const moon2OrbitNode = new Node("moon2 orbit");
moon2OrbitNode.localMatrix = m4.translation(40,0,0);
m4.multiply( m4.yRotation(Math.PI), moon2OrbitNode.localMatrix, moon2OrbitNode.localMatrix);
const moon2Node = new Node("moon2");
moon2Node.localMatrix = m4.scaling(.5,.6,.5);
moon2Node.drawInfo = {
  uniforms: {
    u_colorOffset: [.5,.3,.2,1],
    u_colorMult: [.3,.3,.3,1]
  },
};

//this will be orbiting in the yz plane (xRotation)
const binaryOrbitNode = new Node("binary planetoids");
binaryOrbitNode.localMatrix = m4.translation(0,105,0);
m4.multiply( binaryOrbitNode.localMatrix, m4.xRotation(Math.PI/2), binaryOrbitNode.localMatrix);
const b1OrbitNode = new Node("b1 orbit");
const b2OrbitNode = new Node("b2 orbit");
b1OrbitNode.localMatrix = m4.translation(20,0,0);
b2OrbitNode.localMatrix = m4.translation(-20,0,0);
const b1Node = new Node("b1");
const b2Node = new Node("b2");
b1Node.localMatrix = m4.scaling(1.5,1.5,2.5);
b2Node.localMatrix = m4.scaling(1.5,1.5,2.5);
b1Node.drawInfo = {
  uniforms: {
    u_colorOffset: [.3,.2,0,1],
    u_colorMult: [ .4,.6,0,1]
  }
}
b2Node.drawInfo = {
  uniforms: {
    u_colorOffset: [0,.2,.3,1],
    u_colorMult: [ 0,.6,.4,1]
  }
}


//this is the only vertex object model we have
const sphereNode = new Node("sphere",1);
sphereNode.drawInfo = {
  programInfo: programInfo,
  bufferInfo:  sphereBufferInfo
}

const cubeNode = new Node("cube",1);
cubeNode.drawInfo = {
  programInfo: programInfo,
  bufferInfo: cubeBufferInfo
}

solarSystemNode.addChild(sunNode);
solarSystemNode.addChild(earthOrbitNode);
solarSystemNode.addChild(binaryOrbitNode);

earthOrbitNode.addChild(earthNode);
earthOrbitNode.addChild(moonOrbitNode);
moonOrbitNode.addChild(moonNode);
earthOrbitNode.addChild(moon2OrbitNode);
moon2OrbitNode.addChild(moon2Node);

binaryOrbitNode.addChild(b1OrbitNode);
binaryOrbitNode.addChild(b2OrbitNode);
b1OrbitNode.addChild(b1Node);
b2OrbitNode.addChild(b2Node);

//add multiple instances here of underlying vertex models
sunNode.addChild(sphereNode);
earthNode.addChild(sphereNode);
moonNode.addChild(sphereNode);
moon2Node.addChild(sphereNode);
b1Node.addChild(sphereNode);
b2Node.addChild(sphereNode);

const renderObjects = [];
//find the objects to render that are at the end of each path
function dagTraverse(node) {
  
  //console.log(node.name, node.parentCount, node.type);

  if (node.type === 1) {
    if (node.parents.length > 0) {
      //new node as we get each new parent
      const newNode = node.copy(node.parents[node.parentCount]);
      renderObjects.push(newNode);
    }
  }
  node.parentCount++; //more than 1 path to this node

  node.children.forEach((child) => {
    child.parents.push(node);
    dagTraverse(child);
  });
}

dagTraverse(solarSystemNode);

function updateLocalMatrices(fpsAdjust) {

  const baseRot = 0.003 * fpsAdjust;
  m4.multiply(
    m4.yRotation(baseRot),
    earthOrbitNode.localMatrix,
    earthOrbitNode.localMatrix
  );

  m4.multiply(
    m4.axisRotation(moonOrbitAxis, baseRot * 6),
    earthNode.localMatrix,
    earthNode.localMatrix
  );

  m4.multiply(
    m4.axisRotation(moonOrbitAxis, baseRot * 2),
    moonOrbitNode.localMatrix,
    moonOrbitNode.localMatrix
  );

  m4.multiply(
    m4.yRotation(baseRot * 6),
    moon2OrbitNode.localMatrix,
    moon2OrbitNode.localMatrix
  );

  // spin the moon
  m4.multiply(
    m4.axisRotation(moonOrbitAxis, baseRot * 2),
    moonNode.localMatrix,
    moonNode.localMatrix
  );

  m4.multiply(
    m4.yRotation(baseRot * 2),
    sunNode.localMatrix,
    sunNode.localMatrix
  );

  m4.multiply(
    m4.xRotation(baseRot),
    binaryOrbitNode.localMatrix,
    binaryOrbitNode.localMatrix
  );

  const binRot = m4.zRotation(baseRot*3);

  m4.multiply(
    binRot,
    b1OrbitNode.localMatrix,
    b1OrbitNode.localMatrix
  );

  m4.multiply(
    binRot,
    b2OrbitNode.localMatrix,
    b2OrbitNode.localMatrix
  );

  m4.multiply(
    binRot,
    b1Node.localMatrix,
    b1Node.localMatrix
  );

  m4.multiply(
    binRot,
    b2Node.localMatrix,
    b2Node.localMatrix
  );

  //execute the rotations for any user added planets
  rotFuncs.forEach(func=>{func(baseRot)})

}

function addToSceneGraph(planetData) {
  console.log(planetData);
  numNewPlanets ++;

  const {orbitTheta,orbitPhi,dxSun,red,green,blue} = planetData;

  let orbitVector = [dxSun,0,0];
  let orbitAxis = [0,1,0];

  if ( orbitTheta != 0) {
    console.log("tilting orbit out of ecliptic");
    orbitAxis = [ 
      Math.sin(orbitTheta)*Math.cos(orbitPhi),
      Math.cos(orbitTheta),
      Math.sin(orbitTheta)*Math.sin(orbitPhi) ];

    //we just need the vector that is 90 degrees from the axis
    //for the plane of the planet
    const angle2 = orbitTheta + Math.PI/2;
    const orbitalPlaneVec = [
      Math.sin(angle2)*Math.cos(orbitPhi),
      Math.cos(angle2),
      Math.sin(angle2)*Math.sin(orbitPhi) ];   
    
    //initial planet position needs to be at the end of this vector
    //times the distance specified
    orbitVector = m4.scaleVector(m4.normalize(orbitalPlaneVec),dxSun);

  }

  const newOrbitNode = new Node("new Orbit "+numNewPlanets);
  const newPlanetNode = new Node("new Planet "+numNewPlanets);
  newOrbitNode.localMatrix = m4.translation(orbitVector[0],orbitVector[1],orbitVector[2]);
  newPlanetNode.localMatrix = m4.scaling(planetData["size"],planetData["size"],planetData["size"])
  newPlanetNode.drawInfo = {
    uniforms: {
      u_colorOffset: [red/2,green/2,blue/2,1],
      u_colorMult: [ red,green,blue,1]
    }
  }

  solarSystemNode.addChild(newOrbitNode);
  newOrbitNode.addChild(newPlanetNode);
  newPlanetNode.addChild(sphereNode);

  //need a factory function that returns rotation functions for new nodes
  function makeRotFunc(node,rate) {
    return function(baseRot) {
      m4.multiply(m4.yRotation(baseRot*rate),node.localMatrix,node.localMatrix)
    }
  }

  function makeAxialRotFunc(node,axis,rate) {
    return function(baseRot) {
      m4.multiply(m4.axisRotation(axis,baseRot*rate),node.localMatrix,node.localMatrix);
    }
  }

  const orbitRotFunc = makeAxialRotFunc(newOrbitNode,orbitAxis,planetData["orbitRotation"]);
  const planetRotFunc = makeRotFunc(newPlanetNode,planetData["planetRotation"]);

  rotFuncs.push(orbitRotFunc);
  rotFuncs.push(planetRotFunc);

  //find the new paths in the DAG, reset the objects to render
  renderObjects.length = 0;
  dagTraverse(solarSystemNode);

}

export { 
    canvas,gl,
    programInfo, sphereBufferInfo,
    solarSystemNode, sunNode,
    earthOrbitNode, earthNode,
    moonOrbitNode, moonNode, moonOrbitAxis,
    moon2OrbitNode, moon2Node,
    sphereNode,
    shaderText,
    renderObjects,
    updateLocalMatrices,
    addToSceneGraph
}
