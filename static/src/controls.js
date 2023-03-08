var isCliking = false;
const mouse = new THREE.Vector2();
document.addEventListener('mousedown', (e) => {
    mp_refx = (e.clientX/innerWidth) * 2 - 1;
    mp_refy = (e.clientY/innerHeight) * 2 + 1;
    isCliking = true;
});
document.addEventListener('mousemove', (e) => {
    const innermx = ( e.clientX / innerWidth ) * 2 - 1;
    //const innermy = - ( e.clientY / innerHeight ) * 2 + 1;
    const innermy = - ( e.clientY / innerHeight ) * 2 - 1;
    mouse.x = innermx; mouse.y = innermy + 2;
    if (isCliking){
        mpx -= (mp_refx - innermx)/25;
        if (Math.abs(mpy)<pi_over2*.95){mpy -= (mp_refy + innermy)/25;}
        else{
            if (mpy < -pi_over2*.95){if ((mp_refy + innermy) < 0){mpy -= (mp_refy + innermy)/25;}}
            else {if ((mp_refy + innermy) > 0){mpy -= (mp_refy + innermy)/25;}}           
        };
    };
});
document.addEventListener('mouseup', (e) => {if (isCliking){isCliking = false;};});
document.addEventListener( 'mousewheel', (event) => {
    if(cam_mag<12){
        if (cam_mag>.205){cam_mag += Math.pow(cam_mag,1.5)*event.deltaY/(20000);}
        else{if(event.deltaY>0){cam_mag += Math.pow(cam_mag,1.5)*event.deltaY/(20000);}}
        }
    else{if(event.deltaY<0){cam_mag += Math.pow(cam_mag,1.5)*event.deltaY/(20000);};};
});
const myListener = function (event) {
    const keyName = event.key;
    if (keyName=='i'){
        eci = true;
        time = 0;
        earth.rotation.y = 0;
        stars.rotation.y = 0;}; 
    if (keyName=='r'){
        eci = false;
        time = 0;
        earth.rotation.y = 0;
        stars.rotation.y = 0;}; 
};
document.addEventListener('keydown', myListener, true);