#version 300 es
precision mediump float;

const float FLOAT_MAX = 3.402823466e+38;

in vec3 Position;

uniform vec3 CameraPosition;
uniform vec3 SunPosition;
uniform vec3 Scattering;

uniform int LightPoints;
uniform int OpticalDepthPoints;
uniform float DensityFalloff;
uniform float AtmosphereHeight;

out vec4 OutColor;


vec3 center = vec3(0.0);
float planetR = 640.0;
float atmosphereRadius = 650.0;


vec3 sun() {
    vec3 s = center.xyz;
    s.y = 0.0;

    vec3 sunDirection = normalize(SunPosition - s);
    return s + sunDirection * atmosphereRadius;
}

vec2 raySphereIntersection(vec3 sphereCenter, float sphereRadius, vec3 rayStart, vec3 rayDirection) {
    vec3 sphereToRayStart = rayStart - sphereCenter;
    float b = 2.0 * dot(sphereToRayStart, rayDirection);
    float c = dot(sphereToRayStart, sphereToRayStart) - sphereRadius*sphereRadius;
    float d = b*b - 4.0 * c;

    if (d < 0.0) {
        return vec2(FLOAT_MAX, 0.0);
    }

    float sqrtD = sqrt(d);
    float close = max(0.0, (-b - sqrtD) / 2.0);
    float far = (-b + sqrtD) / 2.0;

    if (far < 0.0) {
        return vec2(FLOAT_MAX, 0.0);
    }

    return vec2(close, far - close);
}

float rayPlaneIntersection(vec3 planeOrigin, vec3 planeNormal, vec3 rayStart, vec3 rayDirection) {
    float angle = dot(rayDirection, planeNormal);
    if (abs(angle) < 0.0001) {
        return FLOAT_MAX;
    }

    float d = -dot(planeOrigin, planeNormal);
    return -(dot(rayStart, planeNormal) + d) / angle;
}

float density(vec3 point) {
    float h = length(point - center) - planetR;
    float h01 = h / (atmosphereRadius - planetR);
    return exp(-h01 * DensityFalloff) * (1.0 - h01);
}

float opticalDepth(vec3 start, vec3 direction, float len) {
    vec3 point = start;
    float stepSize = len / (float(OpticalDepthPoints - 1));
    float depth = 0.0;

    for (int i = 0; i < OpticalDepthPoints; i++) {
        float pointDensity = density(point);
        depth += pointDensity * stepSize;
        point += direction * stepSize;
    }

    return depth;
}

vec3 light(float cameraDistance, vec3 start, vec3 direction, float len, vec3 color) {
    vec3 point = start;
    float stepSize = len / (float(LightPoints - 1));
    vec3 scatteredLight = vec3(0.0);
    float viewRayOpticalDepth = 0.0;

    for (int i = 0; i < LightPoints; i++) {
        vec3 sunDirection = normalize(sun() - point);
        float sunRayLength = raySphereIntersection(center, atmosphereRadius, point, sunDirection).y;

        float sunRayOpticalDepth = opticalDepth(point, sunDirection, sunRayLength);
        viewRayOpticalDepth = opticalDepth(point, -direction, stepSize * float(i));

        vec3 transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth) * Scattering);
        float pointDensity = density(point);

        float pointCameraDistance = cameraDistance + stepSize * float(i);
        scatteredLight += Scattering * pointDensity * transmittance * stepSize;
        point += direction * stepSize;
    }

    float colorTransmittance = exp(-viewRayOpticalDepth);
    return color * colorTransmittance + scatteredLight;
}

const float epsilon = 0.0001;



void main() {
    planetR = AtmosphereHeight * 64.0;
    atmosphereRadius = AtmosphereHeight + planetR;
    center = vec3(CameraPosition.x, -planetR, CameraPosition.z);

    vec3 rayStart = CameraPosition;
    vec3 rayDirection = normalize(Position - rayStart);

    vec2 t = raySphereIntersection(center, atmosphereRadius, rayStart, rayDirection);
    float surface = raySphereIntersection(center, planetR, rayStart, rayDirection).x;
    float throughAtmosphere = min(t.y, surface - t.x);

    if (throughAtmosphere > 0.0) {
        vec3 hit = rayStart + rayDirection * (t.x + epsilon);
        vec3 l = light(t.x + epsilon, hit, rayDirection, throughAtmosphere - epsilon, vec3(0.0));
        OutColor = vec4(l, 1.0);
    } else {
        OutColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}