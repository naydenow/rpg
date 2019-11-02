import * as THREE from 'three'
import {ddsLoader, textureLoader} from '../loaders/index';
import TerrainShader from './../shaders/terrain';
import CollisionCreator from './collision.creater';

const worldmap = 'test';

export default class Worls {
  constructor(game) {
    this.game  = game;
    this.host  = 'https://ww.sunnygames.net';
    this.cache = {};

    this.cc = new CollisionCreator(this);

    this.initLigth();

    this.game.mapWorker.on('newGeometry', (data) => {
      this.createRegionTile(data);
    });

    this.game.mapWorker.on('regionChanged', (data) => {
      this.region = data.region;
    });

    this.game.mapWorker.on('removeRegion', (region) => {
      if (!this.cache[region])
        return;

      this.game.scene.remove(this.cache[region].mesh);
    });
  }

  createMaterial({options, region, map}) {
    const t1 = ddsLoader.load(this.host + '/resource/texture/ground/dds/' + options.D.t1 + '.dds');
    t1.wrapS = t1.wrapT = THREE.RepeatWrapping;

    const t2 = ddsLoader.load(this.host + '/resource/texture/ground/dds/' + options.D.t2 + '.dds');
    t2.wrapS = t2.wrapT = THREE.RepeatWrapping;

    const t3 = ddsLoader.load(this.host + '/resource/texture/ground/dds/' + options.D.t3 + '.dds');
    t3.wrapS = t3.wrapT = THREE.RepeatWrapping;

    const t4 = ddsLoader.load(this.host + '/resource/texture/ground/dds/' + options.D.t4 + '.dds');
    t4.wrapS = t4.wrapT = THREE.RepeatWrapping;


    const paintTexture = textureLoader.load(this.host + '/terrain/world/' + map + '/' + region + '/pm.png');

    var shaderMaterilaProps = {
      uniforms:       {
        bumpTexture1: {type: "t", value: paintTexture},
        t1:           {type: "t", value: t1},
        t2:           {type: "t", value: t2},
        t3:           {type: "t", value: t3},
        t4:           {type: "t", value: t4},
        repeat:       {type: 'f', value: 20.0},
      },
      vertexShader:   TerrainShader.vertexShader,
      fragmentShader: TerrainShader.fragmentShader,
      side:THREE.DoubleSide // TODO -collision scan option
    };


    return new THREE.RawShaderMaterial(shaderMaterilaProps);
  }


  createRegionTile(data) {
    const material = this.createMaterial(data);

    const geometry  = new THREE.BufferGeometry();
    const positions = new Float32Array(data.geometry.positions);
    const normals   = new Float32Array(data.geometry.normals);
    const uvs       = new Float32Array(data.geometry.uvs);

    const IndexArrayClass = {
      2: Uint16Array,
      4: Uint32Array
    }[data.bpe.indices];

    const index = new IndexArrayClass(data.geometry.indices);

    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();

    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));


    const plane = new THREE.Mesh(geometry, material);

    plane.position.copy(data.position);

    this.cache[data.region] = {
      region: data.region,
      mesh:   plane,
      geometry,
      material
    };

    this.game.scene.add(plane);
  }

  initLigth() {
    var light = new THREE.DirectionalLight(0xffffff);

    light.position.set(1, 1, 1);
    this.game.scene.add(light);

    var light2 = new THREE.DirectionalLight(0x002288);

    light2.position.set(-1, -1, -1);
    this.game.scene.add(light2);

    var light3 = new THREE.AmbientLight(0x222222);
    this.game.scene.add(light3);
  }

  update() {
  };
}