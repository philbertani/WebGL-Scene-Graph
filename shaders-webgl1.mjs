//keeping this here as reference so we can see the difference between webgl and webgl2 specs

//Screen refers to shaders for directly rendering to Screen as opposed to texture
export const vertexScreen= `
attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 u_matrix;

varying vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
`

export const fragmentScreen = `
precision mediump float;
    
// Passed in from the vertex shader.
varying vec4 v_color;

uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;

void main() {
   gl_FragColor = v_color * u_colorMult + u_colorOffset;
}
`