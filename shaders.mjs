
//Screen refers to shaders for directly rendering to Screen as opposed to texture
export const vertexScreen= `#version 300 es
in vec4 a_position;
in vec4 a_color;

uniform mat4 u_matrix;

out vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
`

export const fragmentScreen = `#version 300 es
precision mediump float;
    
// Passed in from the vertex shader.
in vec4 v_color;

uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;

out vec4 finalColor;

void main() {
   finalColor = v_color * u_colorMult + u_colorOffset;
}
`