/*
    updateUniforms =[{"type":"f","value":1.0,"update":"time"}]

    time -  performance.now();
*/

var WWShaders = function (camera) {

  this.id    = 1;
  this.array = [];

  this.add = function (updateUniforms, object) {
    var id   = this.id++;
    var self = this;
    object.addEventListener('removed', function () {
      self.removeById(id);
    });
    this.array.push({"id": id, "uniforms": updateUniforms});
  }

  this.removeById = function (id) {
    var l = this.array.length;
    while (l--) {
      if (this.array[l].id === id) {
        this.array.splice(l, 1);
        return;
      }
    }
  }

  this.update = function (delta) {
    var t = performance.now();
    var l = this.array.length;

    while (l--) {
      var lu = this.array[l].uniforms.length;
      while (lu--) {
        if (this.array[l].uniforms[lu].update === "time") {
          this.array[l].uniforms[lu].value = t;
        } else if (this.array[l].uniforms[lu].update === "costime") {
          this.array[l].uniforms[lu].value = 0.5 + Math.abs(Math.cos(t));
        }
      }
    }
  }

};

THREE.WWShaders = new WWShaders();


THREE.ShaderLib['translucentBoard'] = {
  uniforms: THREE.UniformsUtils.merge([
    {
      texture1: {type: "t", value: null},
      opacity:  {type: "f", value: 0.7},
      tint:     {type: "v3", value: null}
    }

  ]),

  vertexShader: [
                  "precision mediump float;",
                  "precision mediump int;",
                  "attribute vec2 uv;",
                  "attribute vec3 position;",
                  "uniform mat4 modelViewMatrix;", // optional
                  "uniform mat4 projectionMatrix;", // optional
                  "varying vec2 vUV;",
                  "void main()",
                  "{",
                  "vUV = uv;",
                  "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                  "}",
                ].join("\n"),

  fragmentShader: [
                    "precision mediump float;",
                    "precision mediump int;",
                    "uniform sampler2D texture1;",
                    "uniform float opacity;",
                    "uniform vec3 tint;",
                    "varying vec2 vUV;",
                    "void main()",
                    "{",
                    "gl_FragColor = texture2D(texture1,vUV);",
                    "gl_FragColor.xyz *= tint;",
                    "gl_FragColor.w = 0.4 + cos(opacity*0.008)*0.1;",
                    "}"
                  ].join("\n")

};


THREE.ShaderLib['terrainShader'] = {

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


THREE.ShaderLib['Color'] = {
  uniforms: THREE.UniformsUtils.merge([
    {color: {type: "t", value: null}}

  ]),

  vertexShader: [
                  "precision mediump float;",
                  "precision mediump int;",

                  "attribute vec2 uv;",
                  "attribute vec3 position;",
                  "attribute vec3 normal;",

                  "uniform mat4 modelViewMatrix;", // optional
                  "uniform mat4 projectionMatrix;", // optional
                  "uniform mat4 modelMatrix;",
                  "uniform mat4 normalMatrix;",
                  "uniform mat4 viewMatrix;",

                  "varying vec3 vNormal;",
                  "varying vec4 worldCoord;",

                  "void main()",
                  "{",

                  "vNormal = normal;",

                  "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                  "}",
                ].join("\n"),

  fragmentShader: [
                    "precision mediump float;",
                    "precision mediump int;",

                    "uniform vec3 lightPosition;",
                    "uniform vec3 lightColor;",

                    "uniform vec3 color;",
                    "uniform mat4 modelMatrix;",

                    "varying vec3 vNormal;",

                    "void main(){",
                    "float dProd = max(0.8, dot(vNormal, vec3(vec4( lightPosition, 1.0) * modelMatrix)));",

                    "gl_FragColor = 0.5 * vec4(lightColor*dProd,1.0);",

                    "}"
                  ].join("\n")

};


THREE.ShaderLib['modelColor'] = {
  uniforms: THREE.UniformsUtils.merge([
    {color: {type: "v3", value: [1, 0, 0]}}

  ]),

  vertexShader: [
                  "precision mediump float;",
                  "precision mediump int;",

                  "attribute vec2 uv;",
                  "attribute vec3 position;",
                  "attribute vec3 normal;",


                  "uniform mat4 modelViewMatrix;", // optional
                  "uniform mat4 projectionMatrix;", // optional
                  "uniform mat4 modelMatrix;",
                  "uniform mat4 normalMatrix;",
                  "uniform mat4 viewMatrix;",


                  "varying vec4 worldCoord;",

                  "void main()",
                  "{",
                  "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                  "}",
                ].join("\n"),

  fragmentShader: [
                    "precision mediump float;",
                    "precision mediump int;",

                    "uniform vec3 lightPosition;",
                    "uniform vec3 lightColor;",

                    "uniform mat4 modelMatrix;",
                    "uniform vec3 color;",


                    "void main(){",
                    "gl_FragColor = vec4(color,1.0);",

                    "}"
                  ].join("\n")

};

THREE.ShaderLib['waves'] = {
  uniforms: THREE.UniformsUtils.merge([
    {
      texture1: {type: "t", value: null},
      opacity:  {type: "f", value: 1}
    }

  ]),

  vertexShader: [
                  "precision mediump float;",
                  "precision mediump int;",
                  "attribute vec2 uv;",
                  "attribute vec3 position;",
                  "uniform mat4 modelViewMatrix;", // optional
                  "uniform mat4 projectionMatrix;", // optional
                  "varying vec2 vUV;",
                  "void main()",
                  "{",
                  "vUV = uv;",
                  "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                  "}",
                ].join("\n"),

  fragmentShader: [
                    "precision mediump float;",
                    "precision mediump int;",
                    "uniform sampler2D texture1;",
                    "uniform float opacity;",
                    "varying vec2 vUV;",
                    "void main()",
                    "{",
                    "vec4 texColor = texture2D(texture1, vUV);",
                    "gl_FragColor = vec4(texColor.rgb, texColor.a);",
                    "gl_FragColor.w *= opacity;",
                    "}"
                  ].join("\n")

};

THREE.ShaderLib['transBlue'] = {
  uniforms: THREE.UniformsUtils.merge([
    {
      color:   {type: "v3", value: [.5, .5, .5]},
      opacity: {type: "f", value: 0.7},
      tint:    {type: "v3", value: [1, 1, 1]}
    }

  ]),

  vertexShader: [
                  "precision mediump float;",
                  "precision mediump int;",
                  "attribute vec3 position;",
                  "uniform mat4 modelViewMatrix;", // optional
                  "uniform mat4 projectionMatrix;", // optional
                  "void main()",
                  "{",
                  "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                  "}",
                ].join("\n"),

  fragmentShader: [
                    "precision mediump float;",
                    "precision mediump int;",
                    "uniform vec3 color;",
                    "uniform float opacity;",
                    "uniform vec3 tint;",
                    "void main()",
                    "{",
                    "gl_FragColor = vec4(color,1);",
                    "gl_FragColor.w = max(0.0,min(opacity,0.8));",
                    "}"
                  ].join("\n")

};


THREE.ShaderLib['Landscape'] = {
  uniforms: THREE.UniformsUtils.merge([
    {
      color:   {type: "v3", value: [.5, .5, .5]},
      opacity: {type: "f", value: 0.7},
      tint:    {type: "v3", value: [1, 1, 1]}
    }

  ]),

  vertexShader: [
                  "precision mediump float;",
                  "precision mediump int;",
                  "attribute vec3 position;",
                  "uniform mat4 modelViewMatrix;", // optional
                  "uniform mat4 projectionMatrix;", // optional
                  "void main()",
                  "{",
                  "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                  "}",
                ].join("\n"),

  fragmentShader: [
                    "precision mediump float;",
                    "precision mediump int;",
                    "uniform vec3 color;",
                    "uniform float opacity;",
                    "uniform vec3 tint;",
                    "void main()",
                    "{",
                    "gl_FragColor = vec4(color,1);",
                    "gl_FragColor.w = max(0.0,min(opacity,0.8));",
                    "}"
                  ].join("\n")

};


THREE.ShaderLib['models'] = {
  uniforms: THREE.UniformsUtils.merge([
    {texture: {type: "t", value: null}}

  ]),

  vertexShader: [
                  "precision mediump float;",
                  "precision mediump int;",
                  "attribute vec2 uv;",
                  "attribute vec3 position;",
                  "uniform mat4 modelViewMatrix;", // optional
                  "uniform mat4 projectionMatrix;", // optional
                  "varying vec2 vUV;",
                  "void main()",
                  "{",
                  "vUV = uv;",
                  "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                  "}",
                ].join("\n"),

  fragmentShader: [
                    "precision mediump float;",
                    "precision mediump int;",
                    "uniform sampler2D texture;",
                    "varying vec2 vUV;",
                    "void main()",
                    "{",
                    "gl_FragColor = texture2D(texture,vUV);",
                    "}"
                  ].join("\n")

};