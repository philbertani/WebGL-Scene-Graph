
//Screen refers to shaders for directly rendering to Screen as opposed to texture
export const vertexScreen= `#version 300 es
in vec4 a_position;
in vec4 a_color;
uniform mat4 u_matrix;
out vec4 v_color;

void main() {
  // Multiply the position by the matrix.

  //we can't just use the u_matrix 
  //we need the 3x3 part of the modelView matrix, inverse transpose 
  //norm = u_matrix * vec4(a_normal,1.);

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

export const vertexScreenLit = `#version 300 es
in vec4 a_position;
in vec4 a_color;
in vec3 a_normal;
out vec3 v_normal;
out vec3 v_eyeCoords;
out vec3 v_pos;

out vec4 v_color;
uniform mat4 u_P, u_VW; //projection, view-world

void main() {
  // Multiply the position by the matrix.

  vec4  eyeCoords = u_VW * a_position;

  gl_Position = u_P * eyeCoords;

  // Pass the color to the fragment shader.
  v_color = a_color;
  v_normal = normalize(a_normal); //in case it is not??
  v_eyeCoords = eyeCoords.xyz; // / eyeCoords.w;
  v_pos = a_position.xyz;
}
`

export const fragmentScreenLit = `#version 300 es
precision mediump float;
    
// Passed in from the vertex shader.
in vec4 v_color;
in vec3 v_normal;
in vec3 v_eyeCoords;
in vec3 v_pos;

uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;
uniform mat3 u_N;  //matrix for transforming normals

out vec4 finalColor;

void main() {

  vec3 newNormal = normalize( u_N * v_normal );

  float cameraPos = -200.;
  //this creates a point light source at 0,0,0
  vec3 L = normalize( - (v_eyeCoords + vec3(0.,0., -cameraPos) )  );
  
  float ii = max(0., dot(L,newNormal) );
  finalColor = v_color * u_colorMult + u_colorOffset;
  finalColor *= .6;

  finalColor *= (1. + ii*3.);

  finalColor.xyz *= finalColor.xyz;  //moew dramatic lighting
}
`