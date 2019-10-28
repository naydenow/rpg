import * as THREE from 'three'
import World from './world/index';
import Controls from './controls/index';
import Thread from './theads/thread';

export default class Game {
  constructor() {
    this.scene            = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcccccc);
    // this.scene.fog        = new THREE.FogExp2(0xcccccc, 0.002);
    this.renderer         = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.mapWorker = new Thread("world/map.worker.js", "Map");
    this.clock = new THREE.Clock();

    document.body.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
    // this.camera.position.set(400, 200, 0);

    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    this.controll = new Controls(this, this.camera, this.renderer.domElement);

    this.world = new World(this);

    this.init();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  init() {
    const u = () => {
      const delta = this.clock.getDelta();

      this.controll.update(delta);

      this.renderer.render(this.scene, this.camera);
      // this.world.update();
      requestAnimationFrame(u);
    };

    requestAnimationFrame(u);
  }
}