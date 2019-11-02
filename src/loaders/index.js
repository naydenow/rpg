import {DDSLoader} from './DDSLoader';
import {GLTFLoader} from './GLTFLoader';
import * as THREE from 'three'

const ddsLoader = new DDSLoader();
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

const loadGLTF = async (url, game) => {
    return await new Promise(resolve => {
        gltfLoader.load(url, (gltf) => {
            const model = gltf.scene;
            const animations = gltf.animations;
            const actions = {};

            if (animations && animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);

                animations.forEach(animation => {
                    actions[animation.name] = mixer.clipAction(animation);
                });

                game.mixers.push(mixer);
            }

            resolve({model,actions});
        });
    });
};

export {ddsLoader, textureLoader, gltfLoader, loadGLTF};
