#version 300 es
precision mediump float;

uniform mat4 VP;
uniform vec3 TargetPosition;
uniform float CubeSize;

out vec3 Position;

vec3 Positions[8] = vec3[8](
    vec3(-1.0, -1.0, -1.0), // 0
    vec3( 1.0, -1.0, -1.0), // 1
    vec3( 1.0, -1.0,  1.0), // 2
    vec3(-1.0, -1.0,  1.0), // 3

    vec3(-1.0,  1.0, -1.0), // 4
    vec3( 1.0,  1.0, -1.0), // 5
    vec3( 1.0,  1.0,  1.0), // 6
    vec3(-1.0,  1.0,  1.0)  // 7
);
int Indexes[36] = int[36](
    0, 2, 1, 2, 0, 3, // bottom
    5, 6, 4, 7, 4, 6, // top
    5, 4, 0, 5, 0, 1, // back
    6, 2, 3, 7, 6, 3, // front
    4, 7, 3, 3, 0, 4, // right
    6, 5, 1, 1, 2, 6  // left
);

void main() {
    int index = Indexes[gl_VertexID];

    vec3 position = Positions[index].xyz * CubeSize;

    position.x += TargetPosition.x;
    position.z += TargetPosition.z;

    Position = position;
    gl_Position = VP * vec4(position, 1.0);
}