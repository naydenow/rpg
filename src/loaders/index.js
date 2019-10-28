import { DDSLoader } from './DDSLoader';
import * as THREE from 'three'

const ddsLoader = new DDSLoader();
const textureLoader = new THREE.TextureLoader();

export {ddsLoader,textureLoader};
