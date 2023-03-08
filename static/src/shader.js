const atmosphere = {
  Kr: 0.0025,
  Km: 0.0010,
  ESun: 20.0,
  g: -0.950,
  innerRadius: .100,
  outerRadius: .1025,
  wavelength: [0.650, 0.570, 0.475],
  scaleDepth: 0.25,
  mieScaleDepth: 0.1
};

const AtmUniforms = {
  v3LightPosition: {
    type: "v3",
    value: new THREE.Vector3(1, 0, 0).normalize()
  },
  cPs: {
    type: "v3",
    value: new THREE.Vector3(1, 0, 0)
  },
  v3InvWavelength: {
    type: "v3",
    value: new THREE.Vector3(1 / Math.pow(atmosphere.wavelength[0], 4), 1 / Math.pow(atmosphere.wavelength[1], 4), 1 / Math.pow(atmosphere.wavelength[2], 4))
  },
  fCameraHeight: {
    type: "f",
    value: 0
  },
  fCameraHeight2: {
    type: "f",
    value: 0
  },
  fInnerRadius: {
    type: "f",
    value: atmosphere.innerRadius
  },
  fInnerRadius2: {
    type: "f",
    value: atmosphere.innerRadius * atmosphere.innerRadius
  },
  fOuterRadius: {
    type: "f",
    value: atmosphere.outerRadius
  },
  fOuterRadius2: {
    type: "f",
    value: atmosphere.outerRadius * atmosphere.outerRadius
  },
  fKrESun: {
    type: "f",
    value: atmosphere.Kr * atmosphere.ESun
  },
  fKmESun: {
    type: "f",
    value: atmosphere.Km * atmosphere.ESun
  },
  fKr4PI: {
    type: "f",
    value: atmosphere.Kr * 4.0 * Math.PI
  },
  fKm4PI: {
    type: "f",
    value: atmosphere.Km * 4.0 * Math.PI
  },
  fScale: {
    type: "f",
    value: 1 / (atmosphere.outerRadius - atmosphere.innerRadius)
  },
  fScaleDepth: {
    type: "f",
    value: atmosphere.scaleDepth
  },
  fScaleOverScaleDepth: {
    type: "f",
    value: 1 / (atmosphere.outerRadius - atmosphere.innerRadius) / atmosphere.scaleDepth
  },
  g: {
    type: "f",
    value: atmosphere.g
  },
  g2: {
    type: "f",
    value: atmosphere.g * atmosphere.g
  },
  nSamples: {
    type: "i",
    value: 3
  },
  fSamples: {
    type: "f",
    value: 3.0
  },
  tDisplacement: {
    type: "t",
    value: 0
  },
  tSkyboxDiffuse: {
    type: "t",
    value: 0
  },
  fNightScale: {
    type: "f",
    value: 1
  }
};



const vertexSky =`
uniform vec3 v3LightPosition;    // The direction vector to the light source
uniform vec3 v3InvWavelength;  // 1 / pow(wavelength, 4) for the red, green, and blue channels   
uniform vec3 cPs;  // camera that will rotate  
uniform float fCameraHeight;   // The camera's current height
uniform float fCameraHeight2;   // fCameraHeight^2
uniform float fOuterRadius;     // The outer (atmosphere) radius
uniform float fOuterRadius2;  // fOuterRadius^2
uniform float fInnerRadius;      // The inner (planetary) radius
uniform float fInnerRadius2;   // fInnerRadius^2
uniform float fKrESun;           // Kr * ESun
uniform float fKmESun;            // Km * ESun
uniform float fKr4PI;         // Kr * 4 * PI
uniform float fKm4PI;           // Km * 4 * PI
uniform float fScale;           // 1 / (fOuterRadius - fInnerRadius)
uniform float fScaleDepth;        // The scale depth (i.e. the altitude at which the atmosphere's average density is found)
uniform float fScaleOverScaleDepth;  // fScale / fScaleDepth
const int nSamples = 3;
const float fSamples = 3.0;
varying vec3 v3Direction;
varying vec3 c0;
varying vec3 c1;
float scale(float fCos)
{
  float x = 1.0 - fCos;
  return fScaleDepth * exp(-0.00287 + x*(0.459 + x*(3.83 + x*(-6.80 + x*5.25))));
}
void main(void)
{
  // Get the ray from the camera to the vertex and its length (which is the far point of the ray passing through the atmosphere)
  vec3 v3Ray = position - cPs;
  float fFar = length(v3Ray);
  v3Ray /= fFar;

  // Calculate the closest intersection of the ray with the outer atmosphere (which is the near point of the ray passing through the atmosphere)
  float B = 2.0 * dot(cPs, v3Ray);
  float C = fCameraHeight2 - fOuterRadius2;
  float fDet = max(0.0, B*B - 4.0 * C);
  float fNear = 0.5 * (-B - sqrt(fDet));

  // Calculate the ray's starting position, then calculate its scattering offset
  vec3 v3Start = cPs + v3Ray * fNear;
  fFar -= fNear;
  float fStartAngle = dot(v3Ray, v3Start) / fOuterRadius;
  float fStartDepth = exp(-1.0 / fScaleDepth);
  float fStartOffset = fStartDepth * scale(fStartAngle);

  // Initialize the scattering loop variables
  float fSampleLength = fFar / fSamples;
  float fScaledLength = fSampleLength * fScale;
  vec3 v3SampleRay = v3Ray * fSampleLength;
  vec3 v3SamplePoint = v3Start + v3SampleRay * 0.5;

  // Now loop through the sample rays
  vec3 v3FrontColor = vec3(0.0, 0.0, 0.0);
  for(int i=0; i<nSamples; i++)
  {
    float fHeight = length(v3SamplePoint);
    float fDepth = exp(fScaleOverScaleDepth * (fInnerRadius - fHeight));
    float fLightAngle = dot(v3LightPosition, v3SamplePoint) / fHeight;
    float fCameraAngle = dot(v3Ray, v3SamplePoint) / fHeight;
    float fScatter = (fStartOffset + fDepth * (scale(fLightAngle) - scale(fCameraAngle)));
    vec3 v3Attenuate = exp(-fScatter * (v3InvWavelength * fKr4PI + fKm4PI));
    v3FrontColor += v3Attenuate * (fDepth * fScaledLength);
    v3SamplePoint += v3SampleRay;
  }

  // Finally, scale the Mie and Rayleigh colors and set up the varying variables for the pixel shader
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  c0 = v3FrontColor * (v3InvWavelength * fKrESun);
  c1 = v3FrontColor * fKmESun;
  v3Direction = cPs - position;
}
`

const fragmentSky = `
uniform vec3 v3LightPos;
uniform float g;
uniform float g2;
varying vec3 v3Direction;
varying vec3 c0;
varying vec3 c1;

// Calculates the Mie phase function
float getMiePhase(float fCos, float fCos2, float g, float g2)
{
  return 1.5 * ((1.0 - g2) / (2.0 + g2)) * (1.0 + fCos2) / pow(1.0 + g2 - 2.0 * g * fCos, 1.5);
}

// Calculates the Rayleigh phase function
float getRayleighPhase(float fCos2)
{
  return 0.75 + 0.75 * fCos2;
}

void main (void)
{
  float fCos = dot(v3LightPos, v3Direction) / length(v3Direction);
  float fCos2 = fCos * fCos;
  vec3 color =    getRayleighPhase(fCos2) * c0 +
  getMiePhase(fCos, fCos2, g, g2) * c1;
  gl_FragColor = vec4(color, 1.0);
  gl_FragColor.a = gl_FragColor.b;
}
`

vertexGround =`
uniform vec3 v3LightPosition;       // The direction vector to the light source
uniform vec3 cPs;       // camera that will rotate  
uniform vec3 v3InvWavelength;  // 1 / pow(wavelength, 4) for the red, green, and blue channels
uniform float fCameraHeight;   // The camera's current height
uniform float fCameraHeight2;   // fCameraHeight^2
uniform float fOuterRadius;     // The outer (atmosphere) radius
uniform float fOuterRadius2;  // fOuterRadius^2
uniform float fInnerRadius;      // The inner (planetary) radius
uniform float fInnerRadius2;   // fInnerRadius^2
uniform float fKrESun;           // Kr * ESun
uniform float fKmESun;            // Km * ESun
uniform float fKr4PI;         // Kr * 4 * PI
uniform float fKm4PI;           // Km * 4 * PI
uniform float fScale;           // 1 / (fOuterRadius - fInnerRadius)
uniform float fScaleDepth;        // The scale depth (i.e. the altitude at which the atmosphere's average density is found)
uniform float fScaleOverScaleDepth;  // fScale / fScaleDepth
uniform sampler2D tDiffuse;
varying vec3 v3Direction;
varying vec3 c0;
varying vec3 c1;
varying vec3 vNormal;
varying vec2 vUv;
const int nSamples = 3;
const float fSamples = 3.0;

float scale(float fCos)
{
  float x = 1.0 - fCos;
  return fScaleDepth * exp(-0.00287 + x*(0.459 + x*(3.83 + x*(-6.80 + x*5.25))));
}

void main(void)
{
  // Get the ray from the camera to the vertex and its length (which is the far point of the ray passing through the atmosphere)
  vec3 v3Ray = position - cPs;
  float fFar = length(v3Ray);
  v3Ray /= fFar;
  // Calculate the closest intersection of the ray with the outer atmosphere (which is the near point of the ray passing through the atmosphere)
  float B = 2.0 * dot(cPs, v3Ray);
  float C = fCameraHeight2 - fOuterRadius2;
  float fDet = max(0.0, B*B - 4.0 * C);
  float fNear = 0.5 * (-B - sqrt(fDet));
  // Calculate the ray's starting position, then calculate its scattering offset
  vec3 v3Start = cPs + v3Ray * fNear;
  fFar -= fNear;
  float fDepth = exp((fInnerRadius - fOuterRadius) / fScaleDepth);
  float fCameraAngle = dot(-v3Ray, position) / length(position);
  float fLightAngle = dot(v3LightPosition, position) / length(position);
  float fCameraScale = scale(fCameraAngle);
  float fLightScale = scale(fLightAngle);
  float fCameraOffset = fDepth*fCameraScale;
  float fTemp = (fLightScale + fCameraScale);
  // Initialize the scattering loop variables
  float fSampleLength = fFar / fSamples;
  float fScaledLength = fSampleLength * fScale;
  vec3 v3SampleRay = v3Ray * fSampleLength;
  vec3 v3SamplePoint = v3Start + v3SampleRay * 0.5;
  // Now loop through the sample rays
  vec3 v3FrontColor = vec3(0.0, 0.0, 0.0);
  vec3 v3Attenuate;
  for(int i=0; i<nSamples; i++)
  {
    float fHeight = length(v3SamplePoint);
    float fDepth = exp(fScaleOverScaleDepth * (fInnerRadius - fHeight));
    float fScatter = fDepth*fTemp - fCameraOffset;
    v3Attenuate = exp(-fScatter * (v3InvWavelength * fKr4PI + fKm4PI));
    v3FrontColor += v3Attenuate * (fDepth * fScaledLength);
    v3SamplePoint += v3SampleRay;
  }
  // Calculate the attenuation factor for the ground
  c0 = v3Attenuate;
  c1 = v3FrontColor * (v3InvWavelength * fKrESun + fKmESun);
  vUv = uv;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const fragmentGround = `
uniform float fNightScale;
uniform vec3 v3LightPosition;
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuseNight;
varying vec3 c0;
varying vec3 c1;
varying vec3 vNormal;
varying vec2 vUv;
void main (void)
{
  vec3 diffuseTex = texture2D( tDiffuse, vUv ).xyz;
  vec3 diffuseNightTex = texture2D( tDiffuseNight, vUv ).xyz;
  vec3 day = diffuseTex * c0;
  vec3 night = fNightScale * diffuseNightTex  * (1.0 - c0);
  gl_FragColor = vec4(c1, 1.0) + vec4(day + night, 1.0);
}
`

const MoonUniforms = {sunDirection:{value: new THREE.Vector3([1,0,0])}};

const vertexMoon = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentMoon = `
uniform sampler2D MoondayTexture;
uniform sampler2D MoonnightTexture;
uniform vec3 sunDirection;
varying vec2 vUv;
varying vec3 vNormal;
void main( void ) {
  vec3 t0 = texture2D( MoondayTexture, vUv ).rgb; // day
  vec3 t1 = texture2D( MoonnightTexture, vUv ).rgb; // night
  float NdotL = dot(normalize(vNormal), sunDirection);
  float y = smoothstep(-0.2, 0.2, NdotL);
  vec3 final_color = t0 * y + t1 * (1.0-y);
  gl_FragColor = vec4(final_color, 1.0);
}
`
