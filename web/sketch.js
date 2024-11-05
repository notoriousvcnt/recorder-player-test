let margin;
let buttonSize;
let separation;
let buttons = [];

//RNBO specifics
const { createDevice, TimeNow, MessageEvent }  = RNBO; 
let device;
let context;
const SAMPLES = {"toro01": "media/audio/toro01.mp3"};

async function loadRNBOdevice(){
    let WAContext = window.AudioContext || window.webkitAudioContext;
    context = new WAContext();
    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);
    
    //fetch patcher
    let rawPatcher = await fetch("export/webRecorderPlayer.export.json");
    let patcher = await rawPatcher.json();

    //call the library
    device = await RNBO.createDevice({context, patcher});

    //await loadSamples(device);

    let startButton = document.getElementById("start");
    let playButton = document.getElementById("play");
    let recordingTime = document.getElementById("recordingTime");
    

    addButtonListener(device, startButton, playButton);

    device.messageEvent.subscribe((ev) => {
        if (ev.tag === "recordingFinished" && ev.payload == 1){
            console.log(`Grabacion Finalizada!`);
            playButton.removeAttribute("disabled");
        }
        
        if (ev.tag === "recordingProgress"){
            recordingTime.innerText = ev.payload.toFixed(2);
        }

    });


    connectMicrophone(device);
    device.node.connect(outputNode);

    document.body.onclick = () => {
        context.resume(); 
    }
    console.log("RNBO device loaded.");
}

loadRNBOdevice();



//RNBO Functions
async function loadSamples(device){
    for (let id in SAMPLES){
        const url = SAMPLES[id];
        await loadSample(url,id,device);
    }
    //enableButtons();
}

async function loadSample(url,id,device){
    //load audio to buffer
   const fileResponse = await fetch(url);
   const arrayBuf = await fileResponse.arrayBuffer();

   //decode audio
   const audioBuf = await context.decodeAudioData(arrayBuf);
   await device.setDataBuffer(id,audioBuf);
}

function connectMicrophone(device){
    // Assuming you have a RNBO device already, and an audio context as well
    const handleSuccess = (stream) => {
        const source = context.createMediaStreamSource(stream);
        source.connect(device.node);
    }
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(handleSuccess);
}

function sendMessageToInport(message,inportTag){
    const event = new MessageEvent(TimeNow, inportTag, [message]);
    device.scheduleEvent(event);
}

function addButtonListener(device, startButton, playButton){
    startButton.addEventListener("click", () =>{
        sendMessageToInport(1,"onOff");
        playButton.setAttribute("disabled","");
        console.log('sent message to onOff inport.');
    });

    playButton.addEventListener("click", () =>{
        sendMessageToInport(1,"play");
        console.log('sent message to play inport.');
    });

}