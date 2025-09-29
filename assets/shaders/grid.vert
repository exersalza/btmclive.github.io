#version 300 es
precision mediump float;

uniform mat4 VP;
uniform vec3 TargetPosition;
uniform float GridSize;

out vec3 Position;

vec3 Positions[4] = vec3[4](
    vec3(-1.0, 0.0, -1.0),
    vec3( 1.0, 0.0, -1.0),
    vec3( 1.0, 0.0,  1.0),
    vec3(-1.0, 0.0,  1.0)
);
int Indexes[6] = int[6](0, 2, 1, 2, 0, 3);

void main() {
    int index = Indexes[gl_VertexID];

    vec3 position = Positions[index].xyz * GridSize;

    position.x += TargetPosition.x;
    position.z += TargetPosition.z;

    Position = position;
    gl_Position = VP * vec4(position, 1.0);
}