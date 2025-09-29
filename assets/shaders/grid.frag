#version 300 es
precision mediump float;

in vec3 Position;

uniform float GridSize;
uniform float CellSize;
uniform float CellGap;
uniform vec3 LineColorThick;
uniform vec3 LineColorThin;
uniform vec3 CameraPosition;

out vec4 OutColor;

float lod_alpha(float lod, vec2 dPosition) {
    vec2 lod_position = mod(Position.xz, lod) / dPosition;
    vec2 v = vec2(1.0) - abs(clamp(lod_position, 0.0, 1.0) * 2.0 - vec2(1.0));
    return max(v.x, v.y);
}

void main() {
    vec2 dy = vec2(dFdx(Position.z), dFdy(Position.z));
    vec2 dx = vec2(dFdx(Position.x), dFdy(Position.x));

    float dy_length = length(dy);
    float dx_length = length(dx);

    vec2 dPosition = vec2(dx_length, dy_length);

    float dPosition_length = length(dPosition);

    float LOD = max(0.0, log2(dPosition_length * CellGap / CellSize) + 1.0);
    float LOD_fract = fract(LOD);

    float LOD0 = CellSize * pow(2.0, floor(LOD));
    float LOD1 = LOD0 * 2.0;
    float LOD2 = LOD1 * 2.0;

    dPosition *= 4.0;

    float LOD0_alpha = lod_alpha(LOD0, dPosition);
    float LOD1_alpha = lod_alpha(LOD1, dPosition);
    float LOD2_alpha = lod_alpha(LOD2, dPosition);

    vec4 color;

    if (LOD2_alpha > 0.0) {
        color = vec4(LineColorThick, LOD2_alpha);
    } else if (LOD1_alpha > 0.0) {
        color = vec4(mix(LineColorThick, LineColorThin, LOD_fract), LOD1_alpha);
    } else {
        color = vec4(LineColorThin, LOD0_alpha * (1.0 - LOD_fract));
    }

    color.a *= 1.0 - length(Position - CameraPosition) / (0.9 * GridSize);

    if (color.a < 0.05) {
        discard;
    } else {
        OutColor = color;
    }
}