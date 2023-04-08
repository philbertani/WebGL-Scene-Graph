import Node from "./dagDef.mjs"
import * as m4 from "./m4.mjs"
import * as webglUtils from "./webgl-utils.mjs"
import * as primitives from "./primitives.mjs"
import * as shaders from "./shaders.mjs"

const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2");

const shaderText = [];
shaderText.push(shaders.vertexScreenLit);    //shader text from template string
shaderText.push(shaders.fragmentScreenLit);

const programInfo = webglUtils.createProgramInfo(gl, shaderText);
const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(
  gl,7,35,21
);

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
const moonOrbitPlane = m4.normalize([1,.3,0]);
//the axis of rotation for this plane is above vector rotated around z axis
//by 90 degrees
const moonOrbitAxis = m4.transformPoint(m4.zRotation(Math.PI/2),moonOrbitPlane);
const moonOrbitNode = new Node("moon orbit");
const mT = m4.scaleVector(moonOrbitPlane,30);
//console.log(mT)
moonOrbitNode.localMatrix = m4.translation(mT[0],mT[1],mT[2]); // moon 30 units from the earth
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

//this is the only vertex object model we have
const sphereNode = new Node("sphere",1);
sphereNode.drawInfo = {
  programInfo: programInfo,
  bufferInfo:  sphereBufferInfo
}

solarSystemNode.addChild(sunNode);
solarSystemNode.addChild(earthOrbitNode);
earthOrbitNode.addChild(earthNode);
earthOrbitNode.addChild(moonOrbitNode);
moonOrbitNode.addChild(moonNode);
earthOrbitNode.addChild(moon2OrbitNode);
moon2OrbitNode.addChild(moon2Node);

sunNode.addChild(sphereNode);
earthNode.addChild(sphereNode);
moonNode.addChild(sphereNode);
moon2Node.addChild(sphereNode);

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

    const baseRot = .003 * fpsAdjust;
    m4.multiply(
        m4.yRotation(baseRot),
        earthOrbitNode.localMatrix,
        earthOrbitNode.localMatrix
      );
  
      m4.multiply(
        m4.axisRotation(moonOrbitAxis,baseRot*6),
        earthNode.localMatrix,
        earthNode.localMatrix
      );
  
      m4.multiply(
        m4.axisRotation(moonOrbitAxis,baseRot*2),
        moonOrbitNode.localMatrix,
        moonOrbitNode.localMatrix
      );
  
      m4.multiply(
        m4.yRotation(baseRot*6),
        moon2OrbitNode.localMatrix,
        moon2OrbitNode.localMatrix
      );
  
      // spin the moon
      m4.multiply(
        m4.axisRotation(moonOrbitAxis,baseRot*2),
        moonNode.localMatrix,
        moonNode.localMatrix
      );
  
      m4.multiply(
        m4.yRotation(baseRot*2),
        sunNode.localMatrix,
        sunNode.localMatrix
      );

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
    updateLocalMatrices
}
