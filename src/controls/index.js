import * as THREE from 'three';
import Player from './player';
import Keyboard from './keyboard';
import {PointerLockControls} from "./PointerLockControls";

const emptyVector = new THREE.Vector3();

export default class {
    constructor(game, camera, domElement) {
        this.game = game;
        this.camera = camera;
        this.keyboard = new Keyboard();

        this.center = new THREE.Object3D();
        this.pinch = new THREE.Object3D();
        this.center.add(this.camera);
        this.pinch.add(this.center);

        this.camera.position.z = 300;

        this.game.scene.add(this.pinch);

        this._ = new PointerLockControls(this.center, this.pinch, domElement);

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.player = new Player(this, this.game, camera);

        this.game.mapWorker.emit('centerPosition', this.center.position.toArray());
        this.game.mapWorker.on('regionChanged', (data) => {
            this.game.controlsWorker.emit('onRegionChange', data);
        });

        this.game.controlsWorker.on('newPlayerPosition', data => {
            this.pinch.position.fromArray(data);
        });

        this.keyboard.on('space', () => {
            this.game.controlsWorker.emit('jump', {})
        });

        document.addEventListener("wheel", event => {
            const delta = Math.sign(event.deltaY);
            this.camera.position.z += delta*10;
        });
    }

    update(delta) {
        this.direction = this.pinch.getWorldDirection(emptyVector);
        //this.direction.y = 0;

        this.direction.normalize();

        this.game.controlsWorker.emit('onControllUpdate', [
            this.keyboard.pressed("W"),
            this.keyboard.pressed("S"),
            this.keyboard.pressed("A"),
            this.keyboard.pressed("D"),
            delta,
            this.direction
        ]);


        // if (this.keyboard.pressed("W")) {
        //     this.pinch.position.addScaledVector(this.direction, 4000.0 * delta);
        // }
        //
        // if (this.keyboard.pressed("S")) {
        //     this.pinch.position.addScaledVector(this.direction, 4000.0 * -delta);
        // }

        this.player.update(delta);

        const p = this.pinch.position.clone();

        if (this._oldCenterPosition)
            if (p.x !== this._oldCenterPosition.x || p.y !== this._oldCenterPosition.y || p.z !== this._oldCenterPosition.z) {
                this.game.mapWorker.emit('centerPosition', p.toArray());
            }

        this._oldCenterPosition = p;
    }
}