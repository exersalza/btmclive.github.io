#version 300 es
precision mediump float;

// Vertex attributes
layout (location = 0) in vec3 aPosition;

// Uniforms
uniform mat4 MVP;

void main() {
    gl_Position = MVP * vec4(aPosition, 1.0);
}
