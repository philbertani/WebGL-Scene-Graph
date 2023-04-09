"use strict";

//DAG version

import * as m4 from "./m4.mjs"
import * as webglUtils from "./webgl-utils.mjs"
import SimpleRotator from "./simpleRotator.mjs";

import { 
  canvas, gl,
  solarSystemNode, 
  renderObjects,  //objects to render
  updateLocalMatrices
} from "./createScene.mjs"

let stopRotation = false;
let fps = 30;

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
    fps = this.valueAsNumber;
  }
  render();

  function render() {

    let prevRenderTime = Date.now();
  
    //multiply base rotation by this to keep orbital velocties constant across diff FPS


    requestAnimationFrame(drawScene);

    function drawScene(time) {

      requestAnimationFrame(drawScene);

      const fpsAdjust = 240/fps;  
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
        2000
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
        webglUtils.setUniforms(programInfo, drawInfo.uniforms);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
      });

 
    }
  }

}

//finally call it
main()