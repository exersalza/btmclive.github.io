#version 300 es
precision mediump float;

#define MAP_AMBIENT_MASK (1 << 0)
#define MAP_DIFFUSE_MASK (1 << 1)
#define MAP_SPECULAR_MASK (1 << 2)
#define MAP_SHININESS_MASK (1 << 3)
#define MAP_BUMP_MASK (1 << 4)

struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    vec2 textureOffset;
    float shininess;
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
uniform sampler2D material_ambient;
uniform sampler2D material_diffuse;
uniform sampler2D material_specular;
uniform sampler2D material_shininess;
uniform sampler2D material_bump;

// Output
out vec4 OutColor;

mat3 TBN;

vec2 get_texture_coords() {
    return TextureCoords + material.textureOffset;
}

vec3 get_ambient() {
    if ((material.maps & MAP_AMBIENT_MASK) != 0) {
        return texture(material_ambient, get_texture_coords()).rgb;
    }

    return material.ambient;
}

vec3 get_diffuse() {
    if ((material.maps & MAP_DIFFUSE_MASK) != 0) {
        return texture(material_diffuse, get_texture_coords()).rgb;
    }

    return material.diffuse;
}

vec3 get_specular() {
    if ((material.maps & MAP_SPECULAR_MASK) != 0) {
        return texture(material_specular, get_texture_coords()).rgb;
    }

    return material.specular;
}

float get_shininess() {
    if ((material.maps & MAP_SHININESS_MASK) != 0) {
        return texture(material_shininess, get_texture_coords()).r;
    }

    return material.shininess;
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
    return lights[i].color * attenuation;
}

vec3 get_light_radiance(int i) {
    vec3 radiance = vec3(0.0);

    switch (get_light_type(i)) {
        case LIGHT_TYPE_POINT: {
            radiance = attenuate_light(i);
            break;
        }

        case LIGHT_TYPE_SPOT: {
            vec3 lightToFragment = normalize(lights[i].position - FragmentPosition);
            float cosAngle = dot(lightToFragment, lights[i].direction);

            if (cosAngle > lights[i].cosAngle) {
                radiance = attenuate_light(i);
            }

            break;
        }

        default: {
            radiance = lights[i].color / lights[i].intensity;
            break;
        }
    }

    return radiance;
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



void main() {
    vec3 l = vec3(0.0);

    for (int i = 0; i < lightsCount; i++) {
        vec3 ambient = get_ambient() * get_diffuse();
        vec3 norm = get_normal();

        vec3 lightDirection = get_light_direction(i);
        vec3 radiance = get_light_radiance(i);

        float alpha = max(dot(norm, lightDirection), 0.0);

        vec3 diffuse = radiance * (alpha * get_diffuse());

        vec3 viewDirection = normalize(ViewPosition - FragmentPosition);
        vec3 reflectDirection = reflect(-lightDirection, norm);

        float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), max(get_shininess() * 128.0, 1.0));
        vec3 specular = radiance * (spec * get_specular());

        vec3 result = ambient + diffuse;
        if (dot(Normal, lightDirection) > 0.0) {
            result += specular;
        }

        l += result;
    }

    OutColor = vec4(
        fog_effect(l),
        1.0
    );
}