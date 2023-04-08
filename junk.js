"use strict";

//DAG version

import * as m4 from "./m4.mjs"
import * as webglUtils from "./webgl-utils.mjs"
import * as primitives from "./primitives.mjs"
import * as shaders from "./shaders.mjs"
import SimpleRotator from "./simpleRotator.mjs";

//node type of 1 means we want to actually render the thing
var Node = function (name,type=0) {
  this.name = name;  
  this.children = [];
  this.parents = [];
  this.parentIndex = 0;
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
  this.parentCount = 0;
  this.type = type;
};

Node.prototype.addChild = function(node) {
    this.children.push(node)
};

Node.prototype.copy = function(node) {
  const copyNode = new Node(node.name + "-copy");
  copyNode.localMatrix = node.localMatrix;
  copyNode.worldMatrix = node.worldMatrix;
  if (node.drawInfo) {
    copyNode.drawInfo = {};  //need new object
    copyNode.drawInfo.bufferInfo = this.drawInfo.bufferInfo;  //copy references
    copyNode.drawInfo.programInfo = this.drawInfo.programInfo;
    copyNode.drawInfo.uniforms = node.drawInfo.uniforms;
  }
  return copyNode;
}

Node.prototype.updateWorldMatrix = function (parentWorldMatrix) {

  if (this.type === 0) {
    if (parentWorldMatrix) {
      // a matrix was passed in so do the math
      m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
    } else {
      // no matrix was passed in so just copy local to world
      m4.copy(this.localMatrix, this.worldMatrix);
    }
  }

  // now process all the children
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function (child) {
    child.updateWorldMatrix(worldMatrix);
  });
};

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  //need a global object or class for this stuff
  let prevMouse = [];
  let mouseChange = [0,0];
  let cameraRotate = {x:0, y:0, z:0};
  let mouseDown = false;
  let rotY = 0, cumRotY = 0;
  const initCameraPos = [0,-.01,200];
  const initCameraDist = m4.length(initCameraPos);
  const initCameraVec = m4.normalize(initCameraPos);
  let cameraPos = [...initCameraPos];
  let cameraMat = m4.translation(0,0,200);

  // creates buffers with position, normal, texcoord, and vertex color
  // data for primitives by calling gl.createBuffer, gl.bindBuffer,
  // and gl.bufferData
  const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(
    gl,7,35,21
  );

  const shaderText = [];
  shaderText.push(shaders.vertexScreenLit);    //shader text from template string
  shaderText.push(shaders.fragmentScreenLit);

  var programInfo = webglUtils.createProgramInfo(gl, shaderText);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  const fieldOfViewRadians = degToRad(70);

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
  console.log(mT)
  moonOrbitNode.localMatrix = m4.translation(mT[0],mT[1],mT[2]); // moon 30 units from the earth
  const moonNode = new Node("moon");
  moonNode.localMatrix = m4.scaling(1.2, 1.2, 1.2);
  moonNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.4, 0.4, 0.4, 1], // gray
      u_colorMult: [0.3, 0.3, 0.3, 1],
    },
  };

  const moon2Orbit = new Node("moon2 orbit");
  moon2Orbit.localMatrix = m4.translation(40,0,0);
  m4.multiply( m4.yRotation(Math.PI), moon2Orbit.localMatrix, moon2Orbit.localMatrix);
  const moon2 = new Node("moon2");
  moon2.localMatrix = m4.scaling(.5,.6,.5);
  moon2.drawInfo = {
    uniforms: {
      u_colorOffset: [.5,.3,.2,1],
      u_colorMult: [.3,.3,.3,1]
    },
  };

  //this is the only vertex object model we have
  const sphere = new Node("sphere",1);
  sphere.drawInfo = {
    programInfo: programInfo,
    bufferInfo:  sphereBufferInfo
  }

  solarSystemNode.addChild(sunNode);
  solarSystemNode.addChild(earthOrbitNode);
  earthOrbitNode.addChild(earthNode);
  earthOrbitNode.addChild(moonOrbitNode);
  moonOrbitNode.addChild(moonNode);
  earthOrbitNode.addChild(moon2Orbit);
  moon2Orbit.addChild(moon2);
  sunNode.addChild(sphere);
  earthNode.addChild(sphere);
  moonNode.addChild(sphere);
  moon2.addChild(sphere);

  const renderObjects = [];

  //find the objects to render that are at the end of each path
  function dagTraverse(node) {
    console.log(node.name,node.parentCount,node.type);

    if (node.type === 1) {
      if ( node.parents.length > 0) {
        //new node as we get each new parent
        const newNode = node.copy(node.parents[node.parentCount])
        renderObjects.push(newNode)
      }
    }
    node.parentCount ++;  //more than 1 path to this node

    node.children.forEach(child=>{ child.parents.push(node); dagTraverse(child)});
  }

  dagTraverse(solarSystemNode);

  console.log(renderObjects);

  canvas.addEventListener("mousemove", ev=>{
    mouseChange = prevMouse[0] ? [ev.clientX-prevMouse[0], ev.clientY-prevMouse[1]] : [0,0];
    prevMouse = [ev.clientX, ev.clientY];
    
    cameraRotate.y = mouseDown ? mouseChange[1] : 0;
    cameraRotate.x = mouseDown ? mouseChange[0] : 0;

  });

  canvas.addEventListener("mousedown", ev=>{
    mouseDown = true;
  });
  canvas.addEventListener("mouseup", ev=>{
    mouseDown = false;
  })

  let rotator = new SimpleRotator(canvas);
  rotator.setViewDistance(200);
  rotator.setRotationCenter( [0,0,0] );

  //console.log( m4.lookAt2(cameraPos, [0,0,0], [0,0,1]) );
  
  requestAnimationFrame(drawScene);

  let prevCameraPos = [...cameraPos];
  let upMult = 1;
  // Draw the scene.
  function drawScene(time) {

    time *= 0.0005;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    rotY = -cameraRotate.y/300;
    cumRotY += rotY;
    if ( Math.abs(cumRotY) > Math.PI/2)  rotY = 0;
    
    // Compute the camera's matrix using look at.

    //add the cumulative (but clamped) mouse change to the initial normalized cam vec
    let newCam = m4.normalize(m4.addVectors(initCameraVec,[0,-rotY,0]));
    //rescale to the same initial distance
    newCam = m4.scaleVector(newCam,initCameraDist);

    cameraPos = m4.transformPoint(m4.xRotation(upMult*rotY),cameraPos);

    let up = [0,0,1];
    if ( cameraPos[1] * prevCameraPos[1] < 0 ) {
      console.log('xxxxxxx');
      //upMult *= -1;
    }

    prevCameraPos = [...cameraPos];

    const target = [0, 0, 0];
  
    //const cameraMatrix = m4.lookAt(cameraPos, target, up);
    const viewMatrix = rotator.getViewMatrix();

    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
 
    // update the local matrices for each object.
    m4.multiply(
      m4.yRotation(.002),
      earthOrbitNode.localMatrix,
      earthOrbitNode.localMatrix
    );

    m4.multiply(
      m4.axisRotation(moonOrbitAxis,.003*6),
      earthNode.localMatrix,
      earthNode.localMatrix
    );

    m4.multiply(
      m4.axisRotation(moonOrbitAxis,.003*2),
      moonOrbitNode.localMatrix,
      moonOrbitNode.localMatrix
    );

    m4.multiply(
      m4.yRotation(.003*6),
      moon2Orbit.localMatrix,
      moon2Orbit.localMatrix
    );

    // spin the moon
    m4.multiply(
      m4.axisRotation(moonOrbitAxis,.003*2),
      moonNode.localMatrix,
      moonNode.localMatrix
    );

    m4.multiply(
      m4.yRotation(.003*2),
      sunNode.localMatrix,
      sunNode.localMatrix
    );

    // Update all world matrices in the scene graph
    solarSystemNode.updateWorldMatrix();

    // Compute all the matrices for rendering
    renderObjects.forEach(function (object) {
      //we can add as many uniforms as we like here,
      //webglUtils.setBuffersAndAttributes will automatically take care of them

      //we need to send perspective, view-world (modelView) and normal transform matrices 
      object.drawInfo.uniforms.u_P = projectionMatrix;
      object.drawInfo.uniforms.u_VW = m4.multiply(viewMatrix,object.worldMatrix);
      object.drawInfo.uniforms.u_N = m4.normalFromMat4(object.drawInfo.uniforms.u_VW);
    });


    let lastUsedProgramInfo = null;
    let lastUsedBufferInfo = null;

    renderObjects.forEach(function (object) {

      const drawInfo = object.drawInfo;

      const programInfo = drawInfo.programInfo;
      const bufferInfo = drawInfo.bufferInfo;
      let bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);

        // We have to rebind buffers when changing programs because we
        // only bind buffers the program uses. So if 2 programs use the same
        // bufferInfo but the 1st one uses only positions the when the
        // we switch to the 2nd one some of the attributes will not be on.
        bindBuffers = true;
      }

      // Setup all the needed attributes.
      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // Set the uniforms.
      webglUtils.setUniforms(programInfo, drawInfo.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

    requestAnimationFrame(drawScene);
  }
}

//finally call it
main()