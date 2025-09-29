#version 300 es
precision mediump float;

#define PI 3.1425926

#define MAP_AO_MASK (1 << 0)
#define MAP_ALBEDO_MASK (1 << 1)
#define MAP_METALLIC_MASK (1 << 2)
#define MAP_ROUGHNESS_MASK (1 << 3)
#define MAP_BUMP_MASK (1 << 4)

struct Material {
    vec3 albedo; // diffuse
    float metallic;
    float roughness; // shininess
    float ao;

    vec2 textureOffset;

    int maps;
};

#define LIGHT_TYPE_POINT 0
#define LIGHT_TYPE_DIRECTIONAL 1
#define LIGHT_TYPE_SPOT 2

struct Light {
    float type;
    float intensity;
    float cosAngle;

    vec3 position;
    float _p0;

    vec3 color;
    float _p1;

    vec3 direction;
    float _p2;
};

#define FOG_FUNCTION_MASK 0xf;
#define FOG_LINEAR 0
#define FOG_LINEAR_END_OFFSET 4
#define FOG_EXP 1
#define FOG_EXP2 2

struct Fog {
    vec3 color;
    float density;
    int function;
};

// Vertex Inputs
in vec3 Normal;
in vec3 FragmentPosition;
in vec2 TextureCoords;

// Uniforms
uniform vec3 ViewPosition;
uniform Fog fog;

layout(std140) uniform Lights {
    Light lights[64];
    int lightsCount;
};

uniform Material material;
uniform sampler2D material_ao; // ambient
uniform sampler2D material_albedo; // diffuse
uniform sampler2D material_metallic; // specular
uniform sampler2D material_roughness; // shininess
uniform sampler2D material_bump;

// Output
out vec4 OutColor;

mat3 TBN;

vec3 pow_vec3(vec3 v, float exp) {
    return vec3(
        pow(v.x, exp),
        pow(v.y, exp),
        pow(v.z, exp)
    );
}

vec2 get_texture_coords() {
    return TextureCoords + material.textureOffset;
}

vec3 get_albedo() {
    if ((material.maps & MAP_ALBEDO_MASK) != 0) {
        return pow_vec3(texture(material_albedo, get_texture_coords()).rgb * material.albedo, 2.2);
    }

    return pow_vec3(material.albedo, 2.2);
}

float get_metallic() {
    if ((material.maps & MAP_METALLIC_MASK) != 0) {
        return texture(material_metallic, get_texture_coords()).r;
    }

    return material.metallic;
}

float get_roughness() {
    if ((material.maps & MAP_ROUGHNESS_MASK) != 0) {
        return 1.0 - texture(material_roughness, get_texture_coords()).r;
    }

    return 1.0 - material.roughness;
}

float get_ao() {
    if ((material.maps & MAP_AO_MASK) != 0) {
        return texture(material_ao, get_texture_coords()).r;
    }

    return material.ao;
}



float get_fog_factor() {
    float z = length(FragmentPosition - ViewPosition);

    int function = fog.function & FOG_FUNCTION_MASK;
    switch (function) {
        case FOG_LINEAR: {
            float end = float(fog.function >> FOG_LINEAR_END_OFFSET);
            return (end - z) / end;
        }

        case FOG_EXP: {
            return exp(-(z * fog.density));
        }

        default: {
            return exp(-(z*z * fog.density*fog.density));
        }
    }
}

vec3 fog_effect(vec3 color) {
    float f = get_fog_factor();
    return f * color + (1.0 - f) * fog.color;
}



mat3 get_TBN() {
    vec3 N = normalize(Normal);

    vec3 position_dx = dFdx(FragmentPosition);
    vec3 position_dy = dFdy(FragmentPosition);
    vec2 textureCoord_dx = dFdx(get_texture_coords());
    vec2 textureCoord_dy = dFdy(get_texture_coords());

    float r = 1.0 / max((textureCoord_dx.x * textureCoord_dy.y - textureCoord_dy.x * textureCoord_dx.y), 1e-6);
    vec3 T = (position_dx * textureCoord_dy.y - position_dy * textureCoord_dx.y) * r;
    vec3 B = cross(N, T);

    return mat3(normalize(T), normalize(B), N);
}

vec3 get_normal() {
    if ((material.maps & MAP_BUMP_MASK) != 0) {
        vec3 n = texture(material_bump, get_texture_coords()).rgb * 2.0 - 1.0;
        return normalize(get_TBN() * n);
    }

    return normalize(Normal);
}



float pbr_distribution(vec3 normal, vec3 halfway, float roughness) {
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float theta = max(dot(normal, halfway), 0.0);
    float theta2 = theta * theta;

    float d = (theta2 * (alpha2 - 1.0) + 1.0);
    return alpha2 / (PI * d*d);
}

float pbr_geometry_schlick(float theta, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    return theta / (theta * (1.0 - k) + k);
}

float pbr_geometry_smith(vec3 normal, vec3 viewDir, vec3 lightDir, float k) {
    float NdotV = max(dot(normal, viewDir), 0.0);
    float NdotL = max(dot(normal, lightDir), 0.0);

    return pbr_geometry_schlick(NdotV, k)
        * pbr_geometry_schlick(NdotL, k);
}

vec3 pbr_fresnel(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 pbr_gamma_correction(vec3 color) {
    vec3 c = color / (color + vec3(1.0));
    return pow(c, vec3(1.0 / 2.2));
}

int get_light_type(int i) {
    return int(round(lights[i].type));
}

vec3 get_light_direction(int i) {
    if (get_light_type(i) == LIGHT_TYPE_POINT) {
        return normalize(lights[i].position - FragmentPosition);
    }

    return -lights[i].direction;
}

vec3 attenuate_light(int i) {
    float distance = length(lights[i].position - FragmentPosition);
    float attenuation = exp(-distance);
    return lights[i].color * lights[i].intensity * attenuation;
}

vec3 get_light_radience(int i) {
    vec3 radiance = vec3(0.0);

    switch (get_light_type(i)) {
        case LIGHT_TYPE_POINT: {
            radiance = attenuate_light(i);
            break;
        }

        case LIGHT_TYPE_SPOT: {
            vec3 lightToFragment = normalize(lights[i].position - FragmentPosition);
            float cosAngle = dot(lightToFragment, -lights[i].direction);

            if (cosAngle > lights[i].cosAngle) {
                radiance = attenuate_light(i);
            }

            break;
        }

        default: {
            radiance = lights[i].color * lights[i].intensity;
            break;
        }
    }

    return radiance;
}

void pbr() {
    vec3 albedo = get_albedo();
    float metallic = get_metallic();
    float roughness = get_roughness();
    float ao = get_ao();

    vec3 normal = get_normal();
    vec3 viewDir = normalize(ViewPosition - FragmentPosition);

    vec3 F0 = mix(vec3(0.04), albedo, metallic);

    vec3 l = vec3(0.0);

    for (int i = 0; i < lightsCount; i++) {
        vec3 lightDir = get_light_direction(i);
        vec3 radiance = get_light_radience(i);

        vec3 halfway = normalize(viewDir + lightDir);

        float NDF = pbr_distribution(normal, halfway, roughness);
        float G = pbr_geometry_smith(normal, viewDir, lightDir, roughness);
        vec3 F = pbr_fresnel(max(dot(halfway, viewDir), 0.0), F0);

        vec3 kD = (vec3(1.0) - F) * (1.0 - metallic);
        vec3 specular = (NDF * G * F) / (4.0 * max(dot(normal, viewDir), 0.0) * max(dot(normal, lightDir), 0.0) + 0.0001);

        float NdotL = max(dot(normal, lightDir), 0.0);
        l += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    vec3 ambient = vec3(0.03) * albedo * ao;
    vec3 color = ambient + l;

    OutColor = vec4(
        fog_effect(
            pbr_gamma_correction(color)
        ),
        1.0
    );
}



void main() {
    pbr();
}