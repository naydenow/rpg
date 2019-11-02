import * as THREE from 'three'
import World from './world/index';
import Controls from './controls/index';
import Thread from './theads/thread';

export default class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xcccccc);
        // this.scene.fog        = new THREE.FogExp2(0xcccccc, 0.002);
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.mapWorker = new Thread("world/map.worker.js", "Map");
        this.controlsWorker = new Thread("control/index.js", "Controls");
        this.clock = new THREE.Clock();
        this.mixers = [];
        document.body.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
        this.scene.add(this.camera);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.controll = new Controls(this, this.camera, this.renderer.domElement);

        this.world = new World(this);

        this.init();

        this.controlsWorker.on('renderCurrentCollisionMap', (data) => {
            this.renderCollisionMap(data);
        })
    }

    renderCollisionMap({map, region}) {
        var material = new THREE.SpriteMaterial({color: 0xf00000});
        var sprite = new THREE.Sprite(material);
        sprite.scale.set(5,5)

        var cub = region.split('=');
        var cx = parseInt(cub[0]) * 2000;
        var cz = parseInt(cub[1]) * 2000;
        var yoffset = 0;

        for (var x in map) {
            for (var z in map[x]) {
                for (var y in map[x][z]) {
                    var v = new THREE.Vector3(cx + x * 10, y * 10 + yoffset, cz + z * 10);

                    var object = sprite.clone();
                    object.position.copy(v);
                    this.scene.add(object);
                }
            }
        }
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

            for (var i = 0; i < this.mixers.length; ++i) {
                this.mixers[i].update(delta);
            }

            this.renderer.render(this.scene, this.camera);
            // this.world.update();
            requestAnimationFrame(u);
        };

        requestAnimationFrame(u);
    }
}