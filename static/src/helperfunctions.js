function norm(r){
    const r_mag = mag(r);
    return [r[0]/r_mag,r[1]/r_mag,r[2]/r_mag]
};

function mag(r){
    return Math.pow(Math.pow(r[0],2)+Math.pow(r[1],2)+Math.pow(r[2],2),.5)
};

function getGround(radius = .1) {
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy() ;
    diffuse.anisotropy = maxAnisotropy;
    diffuseNight.anisotropy = maxAnisotropy;
    AtmUniforms['tDiffuse']={type: "t",value: diffuse};
    AtmUniforms['tDiffuseNight']={type: "t",value: diffuseNight};
    return new THREE.Mesh(
        new THREE.SphereGeometry( radius, 500, 500 ),
        new THREE.ShaderMaterial({
        uniforms: AtmUniforms,
        vertexShader: vertexGround,
        fragmentShader: fragmentGround
        })
    );
};

function getSky(radius = .1) {
    return new THREE.Mesh(
        new THREE.SphereGeometry( radius*1.025, 500, 500 ),
        new THREE.ShaderMaterial({
        uniforms: AtmUniforms,
        vertexShader: vertexSky,
        fragmentShader: fragmentSky,
        side: THREE.BackSide,
        transparent: true
        })
    );
};

function getSun() {
    const lensflare = new Lensflare();
    lensflare.addElement( new LensflareElement( textureFlare0, 500, 0 ) );
    lensflare.addElement( new LensflareElement( textureFlareHex, 60, 1.0 ) );
    lensflare.addElement( new LensflareElement( textureFlareCirc, 10, 0.96 ) );
    lensflare.addElement( new LensflareElement( textureFlareCirc, 30, 0.95 ) );
    lensflare.addElement( new LensflareElement( textureFlareHex, 70, 0.85 ) );
    lensflare.position.set(300*sunvect[0],300*sunvect[1],300*sunvect[2]);
    return lensflare
};

function gaussianRandom(stdev=1) {
    let u = 1 - Math.random(); //Converting [0,1) to (0,1)
    let v = Math.random();
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * pi * v );
    return z * stdev;
};

function starDots1(N,color,map,dist,vary) {
    const starGeometry = new THREE.BufferGeometry();
    const loader = textureLoader;
    const starMaterial = new THREE.PointsMaterial({
        size: 5,
        map: map,
        transparent: true,
        color: color
    });
    const starVertices = [];
    for (let i = 0; i < N; i++){
        //const r = 1250 + 1000*(Math.random()-.5)
        const r = dist + vary*(Math.random()-.5);
        const x = gaussianRandom();
        const y = gaussianRandom();
        const z = gaussianRandom();
        const mag = Math.pow(Math.pow(x,2)+Math.pow(y,2)+Math.pow(z,2),.5)
        starVertices.push(r*x/mag,r*y/mag,r*z/mag);
    };
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    return new THREE.Points(starGeometry,starMaterial)   ;
};
function starDots2(N,color) {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({size: 0.001,color : color});
    const starVertices = [];
    for (let i = 0; i < N; i++){
        const r = 700 + 100*(Math.random()-.5);
        const x = gaussianRandom();
        const y = gaussianRandom();
        const z = gaussianRandom();
        const mag = Math.pow(Math.pow(x,2)+Math.pow(y,2)+Math.pow(z,2),.5)
        starVertices.push(r*x/mag,r*y/mag,r*z/mag);
    };
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    return new THREE.Points(starGeometry,starMaterial)   ;
};

function getStars() {
    const star_group = new THREE.Group();
    star_group.add( starDots1(300,0xffffff,starMap,600,200) ); //white
    star_group.add( starDots1(200,0xFFD580,starMap,600,200) ); //orange
    star_group.add( starDots1(200,0xadd8e6,starMap,600,200) ); //blue
    star_group.add( starDots1(1400,0xffffff,starMap2,400,200) ); //white
    star_group.add( starDots1(300,0xFFD580,starMap2,400,200) ); //orange
    star_group.add( starDots1(300,0xadd8e6,starMap2,400,200) ); //blue
    star_group.add( starDots2(1800,0xffffff) );
    star_group.add( starDots2(600,0xFFD580) );
    star_group.add( starDots2(600,0xadd8e6) );
    return star_group
};

function getMoon(radius) {
    MoonUniforms['MoondayTexture']={value: moonDay};
    MoonUniforms['MoonnightTexture']={value: moonNight};
    const MoonMaterial = new THREE.ShaderMaterial({uniforms: MoonUniforms,vertexShader: vertexMoon,fragmentShader: fragmentMoon,});
    const moon_geometry = new THREE.SphereGeometry(radius, 64, 64 );
    const moon = new THREE.Mesh(moon_geometry, MoonMaterial);
    return moon
};

function xCompCirc(N,r) {
    const y = [];
    for (let i = 0; i < N; i++){y.push( r*Math.cos(i*tau/(N-1)));};
    return y
};
function yCompCirc(N,r) {
    const y = [];
    for (let i = 0; i < N; i++){y.push( r*Math.sin(i*tau/(N-1)));};
    return y
};
function lineplt(x,y,z){
    const points = [];
    // input assumes frame: (0,0,1) is pointing up
    for (let i = 0; i < x.length; i++){points.push( new THREE.Vector3( x[i], z[i], -y[i] ) );};
    return points
};

function addring(ringRadius,color,r=[0,0,0],r_lookAt=[0,0,0]) {
    const ring_material = new THREE.LineBasicMaterial( {color: color,linewidth: 1,});
    const ring_geometry = new THREE.BufferGeometry().setFromPoints( lineplt(xCompCirc(100,ringRadius),yCompCirc(100,0),yCompCirc(100,ringRadius)));
    const ring = new THREE.Line( ring_geometry, ring_material );   
    ring.position.set(r[0],r[1],r[2]);
    ring.lookAt(r_lookAt[0],r_lookAt[1],r_lookAt[2]);
    return ring;
};

function getSat() {
    const satellite = new THREE.Sprite( satellite_flare );
    satellite.scale.set(.015, .015, .015);
    return satellite
};

function getSatRing(radius) {
    const sRing_geometry = new THREE.RingGeometry(2*0.075, 0.2, 64);
    var pos = sRing_geometry.attributes.position;
    var v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++){
    v3.fromBufferAttribute(pos, i);
    sRing_geometry.attributes.uv.setXY(i, v3.length() < 2*0.076 ? 0 : 1, 1);
    }
    const sRing_material = new THREE.MeshBasicMaterial({
        map: textureSaturnRing,
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true
    });
    const sRing_mesh = new THREE.Mesh(sRing_geometry, sRing_material);
    sRing_mesh.rotation.x = pi/6;
    return sRing_mesh 
};

function rotY(theta,r) {
    thetax = Math.cos(theta);
    thetay = Math.sin(theta);
    return [thetax*r[0]+thetay*r[2],r[1],-thetay*r[0]+thetax*r[2]]
};

function rotMoonShader(x,y,z,theta,phi){
    //rotates around x(theta), then y(phi)
    //used to rotate shaders
    const thetax = Math.cos(theta);
    const thetay = Math.sin(theta);
    const f = (-thetay*x + thetax*z)
    const phix = Math.cos(phi);
    const phiy = Math.sin(phi);    
    return [x*thetax + z*thetay, y*phix - phiy*f, y*phiy + phix*f]
};

function updateEciShaders() {
    const r_group = [group.position.x,group.position.y,group.position.z];
    const r_group_cam = [camera.position.x-r_group[0],camera.position.y-r_group[1],camera.position.z-r_group[2]];
    const r_mag = mag(r_group_cam);
    sky.material.uniforms.cPs.value = rotY(-time*dWsidereal,r_group_cam); //if earth is rotating, inertial view
    sky.material.uniforms.fCameraHeight.value = r_mag;
    sky.material.uniforms.fCameraHeight2.value = r_mag*r_mag;
    ground.material.uniforms.v3LightPosition.value = rotY(-time*dWsidereal,sunvect);
    MoonUniforms.sunDirection.value = rotMoonShader(sunvect[0],sunvect[1],sunvect[2],mpx,mpy);
};

function updateEcefShaders() {
    const r_group = [group.position.x,group.position.y,group.position.z];
    const r_group_cam = [camera.position.x-r_group[0],camera.position.y-r_group[1],camera.position.z-r_group[2]];
    const r_mag = mag(r_group_cam);
    sky.material.uniforms.cPs.value = r_group_cam; //ecef view
    sky.material.uniforms.fCameraHeight.value = r_mag;
    sky.material.uniforms.fCameraHeight2.value = r_mag*r_mag;
    ground.material.uniforms.v3LightPosition.value = sunvect;
    MoonUniforms.sunDirection.value = rotMoonShader(sunvect[0],sunvect[1],sunvect[2],mpx,mpy);
};

function updateCamera(argument) {
    camera.position.z = cam_mag*Math.cos(mpx)*Math.cos(mpy);
    camera.position.x = -cam_mag*Math.sin(mpx)*Math.cos(mpy);
    camera.position.y = cam_mag*Math.sin(mpy);
    camera.lookAt(0,0,0);
};

function updateSun(rx,ry,rz) {
    sun.position.set(rx,ry,rz);
};

function updateMoon(rx,ry,rz) {
    moon.position.set(rx,ry,rz);
    moon_ring.position.set(rx,ry,rz);
    moon_ring.lookAt(0,0,0);
};

function updateClock(dt) {
    date = addSeconds(date, dt)
    clock.innerText = date.toUTCString()
};

function updateEcef(time) {
    sunvect = [-Math.cos(time*dWsidereal),0,-Math.sin(time*dWsidereal)];
    stars.rotation.y = -time*dWsidereal;
    updateEcefShaders();
};

function updateEci(time) {
    earth.rotation.y = time*dWsidereal;
    updateEciShaders();
};

function addSeconds(date, seconds) {
  date.setSeconds(date.getSeconds() + seconds);
  return date;
};
