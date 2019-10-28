import {MapControls} from './OrbitControls.js';
import * as THREE from 'three';
import Player from './player';
import Keyboard from './keyboard';
import {OrbitControls} from "./OrbitControls";

export default class {
  constructor(game, camera, domElement) {
    this.game     = game;
    this.keyboard = new Keyboard();

    var geometry = new THREE.SphereBufferGeometry(5, 32, 32);
    var material = new THREE.MeshBasicMaterial({color: 0xffff00});

    this.center = new THREE.Mesh(geometry, material);

    this.game.scene.add(this.center);

    this._                    = new OrbitControls(camera, domElement);
    // this._.enableDamping      = true; // an animation loop is required when either damping or auto-rotation are enabled
    this._.dampingFactor      = 0.05;
    this._.screenSpacePanning = false;
    this._.minDistance        = 100;
    this._.maxDistance        = 50000;
    this._.maxPolarAngle      = Math.PI / 2;

    this.moveForward  = false;
    this.moveBackward = false;
    this.moveLeft     = false;
    this.moveRight    = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.vertex = new THREE.Vector3();

    this.player = new Player(this, this.game, camera);

    this.game.mapWorker.emit('centerPosition', this.center.position.toArray());
  }

  update(delta) {
    if (this.keyboard.pressed("W")) {
      this.moveForward = true;
      this.player.up()
    } else {
      this.moveForward = false;
    }

    if (this.keyboard.pressed("S")) {
      this.moveBackward = true;
      this.player.down();
    } else {
      this.moveBackward = false;
    }

    if (this.keyboard.pressed("D")) {
      this.moveLeft = true;
      this.player.left()
    } else {
      this.moveLeft = false;
    }

    if (this.keyboard.pressed("A")) {
      this.moveRight = true;
      this.player.right()
    } else {
      this.moveRight = false;
    }

    ////////////////////


    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    this.direction.z = Number( this.moveForward ) - Number( this.moveBackward );
    this.direction.x = Number( this.moveRight ) - Number( this.moveLeft );

    this.direction.normalize(); // this ensures consistent movements in all directions

    if ( this.moveForward || this.moveBackward )
      this.velocity.z -= this.direction.z * 40.0 * delta;

    if ( this.moveLeft || this.moveRight )
      this.velocity.x -= this.direction.x * 40.0 * delta;

    this.center.position.add(this.velocity);

    // this._.moveRight( - this.velocity.x * delta );
    // this._.moveForward( - this.velocity.z * delta );
    // this._.getObject().position.y += ( this.velocity.y * delta ); // new behavior
    ////////////////////



    this.player.update(delta);

    //this._.update();
   // this.center.position.copy(this._.target);


    const p = this._.target.clone();

    if (this._oldCenterPosition)
      if (p.x !== this._oldCenterPosition.x || p.y !== this._oldCenterPosition.y || p.z !== this._oldCenterPosition.z) {
        this.game.mapWorker.emit('centerPosition', p.toArray());
      }


    this._oldCenterPosition = p;
  }
}