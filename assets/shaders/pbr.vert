#version 300 es
precision mediump float;

// Vertex attributes
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTextureCoords;

// Uniforms
uniform mat4 MVP;
uniform mat4 Model;

// Vertex Outputs
out vec3 Normal;
out vec3 FragmentPosition;
out vec2 TextureCoords;

void main()
{
    gl_Position = MVP * vec4(aPosition, 1.0f);
    FragmentPosition = vec3(Model * vec4(aPosition, 1.0));
    Normal = transpose(inverse(mat3(Model))) * aNormal;
    TextureCoords = aTextureCoords;
}