import * as THREE from 'three';

export default class Player {
  constructor(controls, game, camera){

    var geometry = new THREE.SphereBufferGeometry(5, 8, 8);
    var material = new THREE.MeshBasicMaterial({color: 0xf00000, wireframe:true});

    this.object = new THREE.Mesh(geometry, material);

    game.scene.add(this.object);
  }

  up(d){

  }

  down(d){

  }

  left(d){

  }

  right(d){

  }



  update(delta){

  }
}