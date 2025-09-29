#version 300 es
precision mediump float;

// Uniforms
uniform vec3 Color;

// Output
out vec4 OutColor;

void main() {
    OutColor = vec4(Color, 1.0);
}
