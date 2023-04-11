"use strict";

//DAG version

import * as m4 from "./m4.mjs"
import * as webglUtils from "./webgl-utils.mjs"
import SimpleRotator from "./simpleRotator.mjs";

import { 
  canvas, gl,
  solarSystemNode, 
  renderObjects,  //objects to render
  updateLocalMatrices,
  addToSceneGraph
} from "./createScene.mjs"

let stopRotation = false;
let fps = 30;
const maxFPS = 240;

function main() {

  if (!gl) {
    return;
  }

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }
  const fieldOfViewRadians = degToRad(40);

  //eck's stuff works beautifully
  let rotator = new SimpleRotator(canvas);
  rotator.setViewDistance(350);
  rotator.setRotationCenter( [0,0,0] );

  document.getElementById("animCheckbox").onchange = function() {
    stopRotation = this.checked;
  }

  document.getElementById("fps").onchange = function() {
    fps = Math.min(maxFPS,this.valueAsNumber);
    document.getElementById("fps").valueAsNumber = fps;
  }

  document.getElementById("addPlanet").onsubmit = function(ev) {
    ev.preventDefault()
    //fields are: dxSun, size, orbitRotation, planetRotation
    const fields = ["dxSun","size","orbitRotation","planetRotation","orbitTheta","orbitPhi"];
    const planetData = {};
    let valid=true;
    for (const field of fields) {
      planetData[field] = parseFloat(this.elements[field].value);
      if (isNaN(planetData[field]) ) {
        alert(`You have a problem in: ${field}`);
        valid = false;
      }
    }
    if (valid) addToSceneGraph(planetData)
  }

  render();

  function render() {

    let prevRenderTime = Date.now();
  
    //multiply base rotation by this to keep orbital velocties constant across diff FPS


    requestAnimationFrame(drawScene);

    function drawScene(time) {

      requestAnimationFrame(drawScene);

      const fpsAdjust = maxFPS/fps;  
      const fpsInterval = 1000 / fps;
      const currentRenderTime = Date.now();
      const elapsed = currentRenderTime - prevRenderTime;
      if (elapsed < fpsInterval ) return;
      prevRenderTime = currentRenderTime - (elapsed % fpsInterval);

      time *= 0.001;
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
      const projectionMatrix = m4.perspective(
        fieldOfViewRadians,
        aspect,
        1,
        1e6
      );

      //from simple-rotator.js by master eck
      const viewMatrix = rotator.getViewMatrix();

      // update the local matrices for each object.
      if ( !stopRotation)
        updateLocalMatrices(fpsAdjust);

      // Update all world matrices in the scene graph
      //solarSystemNode is the top level
      solarSystemNode.updateWorldMatrix();

      // Compute all the matrices for rendering
      renderObjects.forEach(function (object) {
        //we can add as many uniforms as we like here,
        //webglUtils.setBuffersAndAttributes will automatically take care of them

        //we need to send perspective, view-world (modelView) and normal transform matrices
        object.drawInfo.uniforms.u_P = projectionMatrix;
        object.drawInfo.uniforms.u_VW = m4.multiply(
          viewMatrix,
          object.worldMatrix
        );
        object.drawInfo.uniforms.u_N = m4.normalFromMat4(
          object.drawInfo.uniforms.u_VW
        );
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
          bindBuffers = true;
        }

        // Setup all the needed attributes.
        if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
          lastUsedBufferInfo = bufferInfo;
          webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        }

        // Set the uniforms.
        drawInfo.uniforms.u_camDist = rotator.getViewDistance();
        webglUtils.setUniforms(programInfo, drawInfo.uniforms);

        // if bufferInfo.indices exists it will use drawElements using the 
        // ELEMENT_ARRAY_BUFFER
        webglUtils.drawBufferInfo(gl,bufferInfo);

      });

    }
  }

}

//finally call it
main()