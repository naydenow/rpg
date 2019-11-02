import * as THREE from 'three';
import {loadGLTF} from './../loaders';

export default class Player {
    constructor(controls, game, camera) {
        this.game = game;
        this.controls = controls;

        this.object = new THREE.Object3D();
        //this.object.position.y = -30;
        this.controls.pinch.add(this.object);



        this.init();
    }

    async init() {
        const {model, actions} = await loadGLTF('models/soldier.glb', this.game);
        model.scale.set(25, 25, 25);

        this.object.add(model);

        // actions.Run.enabled = true;
        // actions.Run.setEffectiveTimeScale(1);
        // actions.Run.setEffectiveWeight(100);
        actions.Run.play()
    }

    up(d) {

    }

    down(d) {

    }

    left(d) {

    }

    right(d) {

    }


    update(delta) {

    }
}