import * as THREE from 'three';

var lmaterial = new THREE.LineBasicMaterial({color: 0xf00000, linewidth: 9});

var material = new THREE.SpriteMaterial({color: 0x000000});
var ssprite = new THREE.Sprite(material);
ssprite.scale.set(9, 9);
var raycaster = new THREE.Raycaster();


export default class CC {
    constructor(world) {
        this.world = world;
        this.center = new THREE.Vector3();
        this.step = 10;
        this.points = [];
        this.rays = [
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 1)
        ];

    }

    scan(region = this.world.region) {
        const coord = region.split('=');

        this.center.set(coord[0] * 2000, 0, coord[1] * 2000);

        const x = coord[0] * 2000 + 1000;
        const z = coord[1] * 2000 + 1000;

        console.time('sssss1');
        this.scanDirection(new THREE.Vector3(x, -1000, z), 0, -2000, 1, 2);
        console.timeEnd('sssss1');
        //
        console.time('sssss2');
        this.scanDirection(new THREE.Vector3(x, -1000, z), -2000, 0, 1, 3);
        console.timeEnd('sssss2');

        console.time('sssss3');
        this.scanDirectionY(new THREE.Vector3(x, -2000, z - 2000), 2000, 0, 1, 0); // with side:THREE.DoubleSide
        console.timeEnd('sssss3');


        console.time('sssss4');

        this.complite();
        console.timeEnd('sssss4');

    }

    scanDirectionY(vec, zz, xx, ii, vi) {
        var y = 0;
        var z = 0;
        var x = 0;
        var go = true;

        while (go) {
            if (z * this.step > 2000) {
                z = 0;
                if (xx === 0) {
                    if (Math.abs(x * this.step) >= 2000) {
                        go = false;
                        return;
                    }
                    x += ii;
                }
                if (zz === 0) {
                    if (Math.abs(y * this.step) >= 2000) {
                        go = false;
                        return;
                    }
                    y += ii;
                }
            }

            var sterPoint = vec.clone();

            sterPoint.y -= y * this.step;
            sterPoint.x -= x * this.step;
            sterPoint.z += z * this.step;

            var newVect = sterPoint.clone();
            newVect['y'] += zz;
            newVect['x'] += xx;
            this.intersect(sterPoint, newVect, vi);
            z++;
        }
    }

    scanDirection(vec, zz, xx, ii, vi) {
        var y = 0;
        var z = 0;
        var x = 0;
        var go = true;

        while (go) {
            if (y * this.step > 2000) {
                y = 0;
                if (xx === 0) {
                    if (Math.abs(x * this.step) >= 2000) {
                        go = false;
                        return;
                    }
                    x += ii;
                }
                if (zz === 0) {
                    if (Math.abs(z * this.step) >= 2000) {
                        go = false;
                        return;
                    }
                    z += ii;
                }
            }

            var sterPoint = vec.clone();
            sterPoint.y += y * this.step;
            sterPoint.x -= x * this.step;
            sterPoint.z -= z * this.step;

            var newVect = sterPoint.clone();
            newVect['z'] += zz;
            newVect['x'] += xx;
            this.intersect(sterPoint, newVect, vi);
            y++;
        }
    }

    intersect(v1, v2, vi) {
        // var lgeometry = new THREE.Geometry();
        // lgeometry.vertices.push(
        //     v1,
        //     v2
        // );
        //
        // var line = new THREE.Line(lgeometry, lmaterial);
        // this.world.game.scene.add(line);
        //
        // var s = ssprite.clone();
        //
        // s.position.copy(v2.clone())
        //
        // this.world.game.scene.add(s);

        raycaster.set(v1, this.rays[vi]);

        raycaster.camera = this.world.game.camera;

        var intersects = raycaster.intersectObjects(this.world.game.scene.children);

        for (var o in intersects) {
            var obb = intersects[o];

            if (v1.distanceTo(obb.point) <= 2000 && obb.object.type !== 'Line' && obb.object.type !== 'Sprite')
                this.creatPoint(obb.point);
        }
    }

    creatPoint(point) {
        this.points.push(point);
    }

    complite(region = this.world.region) {
        // console.log(this.points);
        // this.points.forEach(p => {
        //     var material = new THREE.SpriteMaterial({color: 0xf00000});
        //     var sprite = new THREE.Sprite(material);
        //     sprite.scale.set(5, 5);
        //     sprite.position.copy(p)
        //     this.world.game.scene.add(sprite);
        // });
        //
        // return;
        var map3 = {};

        this.points.forEach(p => {
            var cub = region.split('=');
            var cx = parseInt(cub[0]) * 2000;
            var cz = parseInt(cub[1]) * 2000;

            var x = Math.floor((p.x - cx) / this.step);
            var y = Math.floor(p.y / this.step);
            var z = Math.floor((p.z - cz) / this.step);


            if (map3[x] === undefined)
                map3[x] = {};

            if (map3[x][z] === undefined)
                map3[x][z] = {};

            if (map3[x][z][y] === undefined) {
                map3[x][z][y] = 1;
            }
        });

        console.log(map3);

        const form = new FormData();

        form.append('action', 'save3dmap');
        form.append('cub', region);
        form.append('map', 'test');
        form.append('data', JSON.stringify(map3));

        fetch('https://ww.sunnygames.net/terrain/php/script/save.php', {
            method: 'POST',
            body: form
        }).then(res => {
            console.log(res);
        });

        //this.world.game.controlsWorker.listener['renderCurrentCollisionMap'][0].fn({region, map: map3})
    }
}