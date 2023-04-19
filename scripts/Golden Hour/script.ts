import { Difficulty, ModelScene, Geometry, LOOKUP, Environment, jsonSet, PRESET, exportZip, LightRemapper, Vec3, baseEnvironmentTrack, CustomEventInternals, CustomEvent, KeyframesVec3, Regex, Vec2, Text } from "https://deno.land/x/remapper@3.1.1/src/mod.ts" // MAKE SURE THIS IS ON THE LATEST REMAPPER VERSION!!!!!!!!!

const map = new Difficulty("ExpertPlusLawless", "ExpertPlusStandard");
// Vars
let env;

env = new Environment(new Regex().add("DayAndNight").separate().add("Day").separate().add("DirectionalLightFront").end(), "Regex");
env.track.value = `DirectionalLightTrack`
env.lightID = 100;
env.lightType = 14;
env.push();
// Functions
function random(min:number, max:number) {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}
function softRemove(lookup: LOOKUP,id: Array<string>,){
    id.forEach((env) =>{
        const begoneTrash = new Environment(env, lookup);
        begoneTrash.position = [-9999,-9999,-9999];
        begoneTrash.push();
    })
}
function hardRemove(lookup: LOOKUP,id: Array<string>,){
    id.forEach((env) =>{
        const dieTrash = new Environment(env, lookup);
        dieTrash.active = false;
        dieTrash.push();
    })
}
baseEnvironmentTrack("FogTrack");
function fogAnimation(time: number, duration: number, anim: (x: CustomEventInternals.AnimateComponent) => void) {
    const fog = new CustomEvent(time).animateComponent("FogTrack", duration);
    anim(fog);
    fog.push();
}
function directionalLightAnimation(number: number, time:number, duration:number, rotation: KeyframesVec3) {
    const dirLight = new CustomEvent(time).animateTrack(`DirectionalLight${number}Track`, duration)
    dirLight.animate.rotation = rotation;
    dirLight.push();
}
function bgLasers(distance: number, number: number, type: number) {
    const bgLarers = new Geometry("Cube", "LightMaterial");
    for (let i = 0; i <= number; i++) {
        let posZ = distance;
        let posX = 0;
        let invert = 1;
        let rotation = 0;
        if (i == 0 || i == 1) {posX = 0; posZ = distance;}
        if (i == 2 || i == 3) {posX = distance; posZ = 0;}
        if (i == 1 || i == 3) {invert = -1;}
        if (i == 3 || i == 2) {rotation = 90;}
        if (i > 0) bgLarers.duplicate = 1;
        bgLarers.position = [posX*invert,-2,posZ*invert];
        bgLarers.scale = [0.001,distance*2.5,0.001];
        bgLarers.rotation = [0,rotation,90];
        bgLarers.lightID = 101+i
        bgLarers.lightType = type;
        bgLarers.track.value = `BackgroundLasersTrack`;
        bgLarers.push();
    }
}
function lasers(type:number,lasers:number,scale:Vec3,rotBounds:Vec2) {
    const laser = new Geometry("Cube","LightMaterial");
    for(let i=0;i<=lasers;i++) {
        if(i > 0) laser.duplicate = 1;
        laser.position = [random(-30,30),scale[1]/2,random(20,30)];
        laser.scale = scale;
        laser.rotation = [random(rotBounds[0],rotBounds[1]),random(rotBounds[0],rotBounds[1]),random(rotBounds[0],rotBounds[1])];
        laser.lightID = 100+i;
        laser.lightType = type;
        laser.track.value = `Laser${i}`;
    }
}
function idOffset(type:number,increment:number,startFrom:number) {
    let i = 0
    map.events.forEach(e => {
        if(e.type == type) e.lightID = startFrom+i;
        if(startFrom+increment == i) i = 0;
        i++;
    })
}

// Materials
map.geoMaterials["LightMaterial"] = {
    shader: "TransparentLight",
    color: [0,0,0]
}
map.geoMaterials["SolidLightMaterial"] = {
    shader: "OpaqueLight",
    color: [0,0,0]
}
map.geoMaterials["DefaultMaterial"] = {
    shader: "BTSPillar",
    color: [0,0,0]
}
map.geoMaterials["TextMaterial"] = {
    shader: "Standard",
    color: [1,1,1],
    shaderKeywords: []
}

// Scene

//  Env Removal
softRemove("Contains",["Rail", "RectangleFakeGlow", "Mirror", "DayAndNight", "Tunnel"]);
hardRemove("Contains",["BackgroundGradient","DirectionalLightBack", "DirectionalLightLeft", "DirectionalLightRight", "HUD", "Player", "Chat"]);

//  ID bumping
//   Spires (Water 1)
const spires = new LightRemapper().type(1);
spires.addToEnd(100);
spires.run();

//   Bloom Lasers (Water 2)
const bloomLaser = new LightRemapper().type(6);
bloomLaser.multiplyColor(20,0.01);
bloomLaser.addToEnd(100);
bloomLaser.run();

//   Normal Lasers (Left Lasers)
const laser = new LightRemapper().type(10);
laser.addToEnd(100);
laser.run();

//   NL (Water 3)
const nl = new LightRemapper().type(7);
nl.multiplyColor(15,0.01);
nl.addToEnd(100);
nl.run();

//   NL Accent (Left Sunbeam)
const nlA = new LightRemapper().type(3);
nlA.multiplyColor(20,0.01);
nlA.addToEnd(100);
nlA.run();

//   Backround Color (Right Lasers)
const bgc = new LightRemapper().type(11);
bgc.multiplyColor(5);
bgc.addToEnd(100);
bgc.run();

//  Lasers
idOffset(13,6,100);
lasers(13,6,[0.3,30,0.3],[-5,5]);
bgLasers(250,10,12);
bgLasers(250,10,3);


//  Fog tuning
fogAnimation(0,0,x => {
    x.fog.attenuation = [0.01],
    x.fog.height = [0],
    x.fog.startY = [-100000],
    x.lightMultiplier.bloomFogIntensityMultiplier = [1],
    x.lightMultiplier.colorAlphaMultiplier = [1]
})
fogAnimation(25.5,30,x => {
    x.fog.attenuation = [[0.01,0],[0.003,1,"easeOutCirc"]];
})
fogAnimation(50.3,0.7,x => {
    x.fog.attenuation = [[0.003,0],[0.001,1,"easeOutCirc"]];
})
fogAnimation(73.5,0.875,x => {
    x.fog.attenuation = [[0.001,0],[0.01,0,"easeInSine"]];
})
fogAnimation(75,0,x => {
    x.fog.attenuation = [0.0005];
})
fogAnimation(122.125,0.875,x => {
    x.fog.attenuation = [[0.0005,0],[0.01,1,"easeOutCirc"]];
})
fogAnimation(146,1,x => {
    x.fog.attenuation = [[0.0005,0],[0.003,1,"easeOutCirc"]];
})
fogAnimation(193.65,0.35,x => {
    x.fog.attenuation = [[0.003,0],[0.001,1,"easeOutCirc"]];
})
fogAnimation(194.40625,0,x => {
    x.fog.attenuation = [0.0005];
})
fogAnimation(242,1,x => {
    x.fog.attenuation = [[0.0005,0],[0.003,1,"easeOutCirc"]];
})
fogAnimation(290,0,x => {
    x.fog.attenuation = [0.01];
})

//  Directional Light
directionalLightAnimation(1,0,0,[180,20,0]);

//  Env stuff
env = new Environment("Waterfall$","Regex");
env.track.value = "waterTrack";
env.push();
const waterAni = new CustomEvent().animateTrack("waterTrack");
waterAni.animate.position = [0, 0, -250];
waterAni.animate.scale = [100, 1, 4];
waterAni.push();

env = new Environment("Sun$", "Regex");
env.scale = [90, 60, 10]
env.position = [0, 0, 1000]
env.push();

//  Spire Lights
const scene = new ModelScene(new Geometry("Cube","DefaultMaterial"))

const lightLeft = new Geometry("Cube","LightMaterial")
lightLeft.lightID = 101;
lightLeft.lightType = 1;
scene.addPrimaryGroups("SpireLight Left", lightLeft)

const lightMiddle = new Geometry("Cube","LightMaterial")
lightLeft.lightID = 102;
lightLeft.lightType = 1;
scene.addPrimaryGroups("SpireLight Middle", lightMiddle)

const lightRight = new Geometry("Cube","LightMaterial")
lightRight.lightID = 103;
lightRight.lightType = 1;
scene.addPrimaryGroups("SpireLight Right", lightRight)

//  Scene Calling
scene.static("Spires");

// Text
const text = new Text("Spires");
const textScene = new ModelScene(new Geometry("Cube","TextMaterial"));
textScene.animate([
    [text.toObjects("Warning: Do not play if you have sensitive eyes"),0],
    [[],10],
    [text.toObjects("Mapped by zr8x"),300]
]);

// Map Specifics
map.require("Chroma", true)
map.rawSettings = PRESET.CHROMA_SETTINGS;
map.settings.mirrorQuality = "HIGH";
map.settings.leftHanded = false;
map.settings.maxShockwaveParticles = 0;
map.settings.lights = "All";
map.settings.smoke = true;
jsonSet(map.rawSettings, "_countersPlus._mainEnabled", false);
jsonSet(map.rawSettings, "_uiTweaks._multiplierEnabled", false);
jsonSet(map.rawSettings, "_uiTweaks._comboEnabled", false);
jsonSet(map.rawSettings, "_uiTweaks._energyEnabled", false);
jsonSet(map.rawSettings, "_uiTweaks._positionEnabled", false);
jsonSet(map.rawSettings, "_uiTweaks._progressEnabled", false); 
map.save();

exportZip(["ExpertPlusLawless"], "Golden Hour - JVKE");