"use strict";

import * as m4 from "./m4.mjs"
import * as webglUtils from "./webgl-utils.mjs"
import * as primitives from "./primitives.mjs"
import * as shaders from "./shaders.mjs"

var Node = function () {
  this.children = [];
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
};

Node.prototype.setParent = function (parent) {
// the website argues that setParent is better than addChild

  // remove us from our parent
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }

  // Add us to our new parent
  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function (parentWorldMatrix) {
  if (parentWorldMatrix) {
    // a matrix was passed in so do the math
    m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
  } else {
    // no matrix was passed in so just copy local to world
    m4.copy(this.localMatrix, this.worldMatrix);
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
  let rotY = 0;
  const initCameraPos = [0,-.01,-200];
  const initCameraDist = m4.length(initCameraPos);
  const initCameraVec = m4.normalize(initCameraPos);

  // creates buffers with position, normal, texcoord, and vertex color
  // data for primitives by calling gl.createBuffer, gl.bindBuffer,
  // and gl.bufferData
  const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(
    gl,
    7,
    32,
    22
  );

  // setup GLSL program
  //this is reading shaders directly from html file
  //we need to make it read from script so we can set
  //#version 300 es
  
  /*
  var programInfo = webglUtils.createProgramInfo(gl, [
    "vertex-shader-3d",
    "fragment-shader-3d",
  ]); 
  */

  const shaderText = [];
  shaderText.push(shaders.vertexScreen);    //straight shader text from template string
  shaderText.push(shaders.fragmentScreen);

  var programInfo = webglUtils.createProgramInfo(gl, shaderText);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function emod(x, n) {
    return x >= 0 ? x % n : (n - (-x % n)) % n;
  }

  var cameraAngleRadians = degToRad(0);
  var fieldOfViewRadians = degToRad(70);
  var cameraHeight = 50;

  var objectsToDraw = [];
  var objects = [];

  // Let's make all the nodes
  var solarSystemNode = new Node();
  var earthOrbitNode = new Node();
  earthOrbitNode.localMatrix = m4.translation(100, 0, 0); // earth orbit 100 units from the sun
  var moonOrbitNode = new Node();
  moonOrbitNode.localMatrix = m4.translation(30, 0, 0); // moon 30 units from the earth

  var sunNode = new Node();
  sunNode.localMatrix = m4.scaling(5, 5, 5); // sun a the center
  sunNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0, 1], // yellow
      u_colorMult: [0.4, 0.4, 0, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  };

  var earthNode = new Node();
  earthNode.localMatrix = m4.scaling(2, 2, 2); // make the earth twice as large
  earthNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.2, 0.5, 0.8, 1], // blue-green
      u_colorMult: [0.8, 0.5, 0.2, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  };

  var moonNode = new Node();
  moonNode.localMatrix = m4.scaling(0.8, 0.8, 0.8);
  moonNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0.6, 1], // gray
      u_colorMult: [0.1, 0.1, 0.1, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  };

  // connect the celetial objects
  sunNode.setParent(solarSystemNode);
  earthOrbitNode.setParent(solarSystemNode);
  earthNode.setParent(earthOrbitNode);
  moonOrbitNode.setParent(earthOrbitNode);
  moonNode.setParent(moonOrbitNode);

  var objects = [sunNode, earthNode, moonNode];

  var objectsToDraw = [sunNode.drawInfo, earthNode.drawInfo, moonNode.drawInfo];

  canvas.addEventListener("mousemove", ev=>{
    mouseChange = prevMouse[0] ? [ev.clientX-prevMouse[0], ev.clientY-prevMouse[1]] : [0,0];
    prevMouse = [ev.clientX, ev.clientY];
    
    cameraRotate.y = mouseDown ? mouseChange[1] : 0;
    cameraRotate.x = mouseDown ? mouseChange[0] : 0;

    if (mouseDown) console.log(rotY);

  });

  canvas.addEventListener("mousedown", ev=>{
    mouseDown = true;
  });
  canvas.addEventListener("mouseup", ev=>{
    mouseDown = false;
  })

  requestAnimationFrame(drawScene);

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
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    rotY += cameraRotate.y/100;
    rotY = Math.max(rotY,0);
    rotY = Math.min(rotY,4);

    // Compute the camera's matrix using look at.
    //let cameraPosition = m4.scaleVector(initCameraVec,initCameraDist);

    //add the cumulative (but clamped) mouse change to the initial normalized cam vec
    let newCam = m4.normalize(m4.addVectors(initCameraVec,[0,-rotY,0]));

    //rescale to the same initial distance
    newCam = m4.scaleVector(newCam,initCameraDist);

    var target = [0, 0, 0];
    var up = [0, 0, 1];
    var cameraMatrix = m4.lookAt(newCam, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // update the local matrices for each object.
    m4.multiply(
      m4.yRotation(.003),
      earthOrbitNode.localMatrix,
      earthOrbitNode.localMatrix
    );
    m4.multiply(
      m4.yRotation(.003*13),
      moonOrbitNode.localMatrix,
      moonOrbitNode.localMatrix
    );
    // spin the earth
    m4.multiply(
      m4.yRotation(.003*365),
      earthNode.localMatrix,
      earthNode.localMatrix
    );
    // spin the moon
    m4.multiply(
      m4.yRotation(.003*13),
      moonNode.localMatrix,
      moonNode.localMatrix
    );

    m4.multiply(
      m4.yRotation(.003*13),
      sunNode.localMatrix,
      sunNode.localMatrix
    );

    // Update all world matrices in the scene graph
    solarSystemNode.updateWorldMatrix();

    // Compute all the matrices for rendering
    objects.forEach(function (object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(
        viewProjectionMatrix,
        object.worldMatrix
      );
    });

    // ------ Draw the objects --------

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function (object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;
      var bindBuffers = false;

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
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

    requestAnimationFrame(drawScene);
  }
}

//finally call it
main()