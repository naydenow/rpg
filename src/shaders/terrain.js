import * as THREE from 'three'

export default {
  uniforms: THREE.UniformsUtils.merge([
    {
      bumpTexture1: {type: "t", value: null},
      t1:           {type: "t", value: null},
      t2:           {type: "t", value: null},
      t3:           {type: "t", value: null},
      t4:           {type: "t", value: null},
      repeat:       {type: 'f', value: 10.0},
    }
  ]),

  vertexShader: [
                  "precision highp float;",
                  "precision highp int;",
                  "attribute vec2 uv;",
                  "attribute vec3 position;",
                  "attribute vec3 normal;",
                  "uniform mat4 modelViewMatrix;", // optional
                  "uniform mat4 projectionMatrix;", // optional
                  "uniform mat4 modelMatrix;",
                  "uniform mat3 normalMatrix;",
                  "uniform mat4 viewMatrix;",
                  "uniform sampler2D bumpTexture1;",
                  "varying vec3 vLightFront;",
                  "varying vec2 vUV;",
                  "varying vec3 vNormal;",
                  "varying vec4 vPos;",
                  "varying vec4 blend;",
                  "varying vec3 vLighting;",
                  "void main()",
                  "{",
                  "vUV = uv;",
                  "vNormal = normal;",
                  "vPos = vec4(   position  , 1.0 );",
                  "blend = texture2D( bumpTexture1, vUV );",
                  "vec3 objectNormal = vec3( normal );",
                  "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

                  "vec3 ambientLight = vec3(0.6, 0.6, 0.6);",
                  "vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);",
                  "vec3 directionalVector = vec3(0.85, 0.8, 0.75);",
                  "vec3 transformedNormal = normalize(normalMatrix * normal);",
                  "float directional = max (dot(transformedNormal, directionalVector),0.0);",
                  "vLighting = ambientLight + (directionalLightColor * directional);",
                  "}",
                ].join("\n"),

  fragmentShader: [
                    "precision highp float;",
                    "precision highp int;",
                    "#define LOG2 1.442695",
                    "#define whiteCompliment(a) ( 1.0 - saturate( a ) )",
                    "#define saturate(a) clamp( a, 0.0, 1.0 )",
                    "uniform sampler2D t1;",
                    "uniform sampler2D t2;",
                    "uniform sampler2D t3;",
                    "uniform sampler2D t4;",
                    "uniform mat4 modelMatrix;",
                    "uniform sampler2D bumpTexture1;",
                    "uniform vec3 diffuse;",
                    "uniform vec3 emissive;",
                    "uniform float opacity;",
                    "uniform float repeat;",
                    "varying vec2 vUV;",
                    "varying vec4 vPos;",
                    "varying vec4 blend;",
                    "varying vec3 vNormal;",
                    "varying vec3 vLighting;",

                    "vec3 getTex( vec3 blending, sampler2D texture, vec4 vPos, float repeat){",
                    "vec3 xaxis = texture2D( texture, vPos.yz * repeat*0.001).rgb;",
                    "vec3 yaxis = texture2D( texture, vPos.zx * repeat*0.001).rgb;",
                    "vec3 zaxis = texture2D( texture, vPos.xy * repeat*0.001).rgb;",
                    "return xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;",
                    "}",

                    "vec3 getTriPlanarBlend(vec3 _wNorm){",
                    "vec3 blending = abs( _wNorm );",
                    "blending = normalize(max(blending, 0.00001));",
                    "float b = (blending.x + blending.y + blending.z);",
                    "blending /= vec3(b, b, b);",
                    "return blending;",
                    "}",

                    "void main()",
                    "{",
                    "vec3 blending = getTriPlanarBlend(vNormal);",
                    "vec3 texture1 = getTex(blending, t1, vPos, repeat);",
                    "vec3 texture2 = getTex(blending, t2, vPos, repeat);",
                    "vec3 texture3 = getTex(blending, t3, vPos, repeat);",
                    "vec3 texture4 = getTex(blending, t4, vPos, repeat);",

                    "vec3 diffuse = texture1 * blend.r +  texture2 * blend.g + texture3 * blend.b + texture4 * (1.0 - blend.a);",

                    "gl_FragColor = vec4(diffuse * vLighting, 1.0);",

                    "}"
                  ].join("\n")

};