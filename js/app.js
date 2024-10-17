
var num_sensors;
var current_sensor;
var sensor_nums = [];
var gotChars=[];
var handlePitches = [];
var handleRolls = [];
var handleYaws = [];
var onDisconnected = [];
const myBLE = [];
let midiOn = [];
let midiSelect = [];
let midiVol = [];
let buffOn = [];
let buffSelect = [];
let buffVol = [];
let scaleSelect = [];
let loadFile = [];

let loading = 0;
let prev_time = 0;

let m=0;

const bufferId = "user";

const characteristicsUUID = {
	pitch:"19b10011-e8f2-537e-4f6c-d104768a1214",
	roll:"19b10012-e8f2-537e-4f6c-d104768a1214",
	yaw:"19b10013-e8f2-537e-4f6c-d104768a1214",
	//led:"19b10011-e8f2-537e-4f6c-d104768a1214",
	//button:"19b10012-e8f2-537e-4f6c-d104768a1214"
}

let pitchCharacteristic=[];
let rollCharacteristic=[];
let yawCharacteristic=[];
let ledCharacteristic=[];

function connectSensor(i) {

		console.log("Connecting sensor number: ", sensor_nums[i]);
		myBLE[i]= new p5ble();

		gotChars[i]=(function(error, characteristics){
			console.log('Connecting to notifications on sensor ', (sensor_nums[i]));
			if (error) console.log('error: ', error)
			else {
			//console.log(characteristics[1].uuid);
				for(let j = 0; j < characteristics.length; j++){
					if(characteristics[j].uuid == characteristicsUUID.pitch){
						pitchCharacteristic[sensor_nums[i]-1] = characteristics[j];
						myBLE[i].startNotifications(pitchCharacteristic[sensor_nums[i]-1], handlePitches[i]);
					}else if(characteristics[j].uuid == characteristicsUUID.roll){
						rollCharacteristic[sensor_nums[i]-1] = characteristics[j];
						myBLE[i].startNotifications(rollCharacteristic[sensor_nums[i]-1], handleRolls[i]);
					}else if(characteristics[j].uuid == characteristicsUUID.yaw){
						yawCharacteristic[sensor_nums[i]-1] = characteristics[j];
						myBLE[i].startNotifications(yawCharacteristic[sensor_nums[i]-1], handleYaws[i]);
					}else if(characteristics[j].uuid == characteristicsUUID.led){
						ledCharacteristic[i] = characteristics[i];
					}
				}
			}
			// Add a event handler when the device is disconnected
			myBLE[i].onDisconnected(onDisconnected[i]);
	  });

		onDisconnected[i]=(function() {
		  console.log("Device got disconnected: "+sensor_nums[i]);
		});

		handlePitches[i]=(function(data){
      sendToMax(i,"tilt",Number(data));
			//sendToMax((sensor_nums[i]*5)+" "+Number(data));
		});
		handleRolls[i]=(function(data){
      sendToMax(i,"roll", Number(data));
			//sendToMax(((sensor_nums[i]*5)+1)+" "+Number(data));
		});
		handleYaws[i]=(function(data){
      sendToMax(i,"yaw", Number(data));
			//sendToMax(((sensor_nums[i]*5)+2)+" "+Number(data));
		});
}


function checkBrowser(){

  //const Bowser = require("bowser"); // CommonJS
  const browser = bowser.getParser(window.navigator.userAgent);
  console.log(`The current browser name is "${browser.getBrowserName()}"`);
  if((browser.getBrowserName())=='Chrome') {
    var retVal = prompt("Enter sensor numbers seperated by a space", "eg 1 2 3");
    console.log("Creating buttons for sensor ", retVal);
    if (retVal==null || retVal==("eg 1 2 3")) {
      sensor_nums=null;
      num_sensors=0;
    } else {
      sensor_nums = retVal.split(' ')
      num_sensors=sensor_nums.length;
    }
    return 0;
  } else {
    alert("Unsupported browser! Please use Chrome");
    return 1;
  }
}

function connectAndStartNotify(index) {

	// Connect to a device by passing the service UUID
	//myBLE1.connect("19b10010-e8f2-537e-4f6c-d104768a1214");
	//myBLE[sensor_val].connect(serviceUUid[sensor_val], gotCharacteristics[sensor_val]);
  if((myBLE[index].isConnected()==false)) {
      myBLE[index].connect(get_serviceUUid(sensor_nums[current_sensor]), gotChars[index]);
  }
}


//make the UUid from a sensor number
function get_serviceUUid(sensor_num) {
	let myUUid;
	if(sensor_num<10)	myUUid = `19b100${sensor_num}0-e8f2-537e-4f6c-d104768a1214`;
	else myUUid = `19b10${sensor_num}0-e8f2-537e-4f6c-d104768a1214`;
	console.log('UUID for sensor '+sensor_num+'='+myUUid);
	return(myUUid);
}


let s = function(p) {


	p.windowResized = function() {
		p.resizeCanvas(innerWidth, innerHeight);
	}


	p.setup = function() {

		p.createCanvas(innerWidth, innerHeight);

    while(checkBrowser()){
    }

    main();
		//connectXebra();

		for (let i=0; i<num_sensors; i++) {
      connectSensor(i);
      midiOn[i]=0;
      buffOn[i]=0;
    }

		prev_time=p.millis();

    drawInputs();

	};



	p.draw = function() {

		p.background(0);

		drawTitle();
    drawInstructions();
    drawSensorSettings();

		drawConnections();
		drawCircle();
    drawSensors();
    //drawInstSelect();

    getInputs();

		if(loading!=num_sensors) drawLoadingscreen();

		//for (let i = 0; i<num_sensors; i++) {
		//	if(myBLE[i].isConnected()){
		//		p.fill(p.color(0, 255, 0));
		//	}else{
		//		p.fill(p.color(255, 0, 0));
		//	}
		//	p.rect(170, (30*(i+3)), 20, 20);
		//}

	};

	function drawLoadingscreen(){
			p.strokeWeight(0);
			p.fill(255, 255, 255, 200);
			p.rect(0, 0, innerWidth, innerHeight);

			p.textSize(24);
			p.fill(0, 102, 153);
			p.textAlign(p.CENTER, p.CENTER);
			p.text('Loading sounds and instruments for sensor '+ (loading+1)+' out of '+num_sensors, innerWidth/2, (innerHeight/2)+70);

			p.textSize(64);
			p.fill(0, 102, 153);
			p.textAlign(p.CENTER, p.CENTER);
			if((p.millis()-prev_time)>0) p.text('LOADING   ', innerWidth/2, innerHeight/2);
			if((p.millis()-prev_time)>1000) p.text('LOADING.  ', innerWidth/2, innerHeight/2);
			if((p.millis()-prev_time)>2000) p.text('LOADING.. ', innerWidth/2, innerHeight/2);
			if((p.millis()-prev_time)>3000) p.text('LOADING...', innerWidth/2, innerHeight/2);
			if((p.millis()-prev_time)>4000) prev_time=p.millis();
	}

  function drawTitle(){
      p.textSize(48);
      p.fill(0, 102, 153);
      p.strokeWeight(0);
      p.textAlign(p.LEFT, p.CENTER);
      p.text('echome web', 30, 50);
  }

  function drawCircle(){
      p.fill(0,0,0);
      p.strokeWeight(10);
      if(context.state !== "running"){
        p.stroke(200, 0, 0);
      } else {
        p.stroke(0, 200, 0);
      }
      p.push();
      p.translate((innerWidth/2)+100, innerHeight/2);
      p.circle(0, 0, innerHeight/6);

      p.textSize(20);
      p.fill(0, 102, 153);
      p.strokeWeight(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('audio', 0, -20);
      if(context.state !== "running"){
        p.text('off', 0, 20);
      } else {
        p.text('on', 0, 20);
      }
  }

  function drawSensors(){

    for(i=0; i<num_sensors; i++){
      let x = 250*p.sin(i*(p.TWO_PI/num_sensors)); //calculate xPos
      let y = 250*p.cos(i*(p.TWO_PI/num_sensors)); //calculate yPos

      p.fill(0,0,0);
      p.strokeWeight(5);
      if(myBLE[i].isConnected()){
        p.stroke(p.color(0, 255, 0));
      }else{
        p.stroke(p.color(255, 0, 0));
      }

      p.push();
      p.translate(x, -y);
      p.circle(0, 0, 100);
      p.textSize(30);
      p.fill(0, 102, 153);
      p.strokeWeight(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(sensor_nums[i], 0, 0);
      p.pop();
    }
    p.pop();
  }

  function drawConnections() {
    for(i=0; i<num_sensors; i++) {
      let x = 100+250*p.sin(i*(p.TWO_PI/num_sensors)); //calculate xPos
      let y = 250*p.cos(i*(p.TWO_PI/num_sensors)); //calculate yPos
      p.strokeWeight(2);
      if((i<num_sensors)&&myBLE[i].isConnected()&&(context.state == "running")){
        p.stroke(p.color(0, 255, 0));
        p.line((innerWidth/2)+x, (innerHeight/2)-y, 100+innerWidth/2, innerHeight/2);
        }else{
        p.stroke(p.color(255, 0, 0));
        p.line((innerWidth/2)+x, (innerHeight/2)-y, 100+innerWidth/2, innerHeight/2);
      }

    }
  }

  function drawInputs(){
    for(i=0; i<num_sensors; i++){
        midiSelect[i] = p.createSelect();
        midiSelect[i].position(70, 550);
        midiSelect[i].option('Harp', 0);
        midiSelect[i].option('Piano', 1);
        midiSelect[i].option('Celesta', 2);
        midiSelect[i].option('Xylophone', 3);
        midiSelect[i].option('Cello', 4);
        midiSelect[i].option('Accordion', 5);
        midiSelect[i].option('Guitar', 6);
        midiSelect[i].option('Percussion', 7);
        midiSelect[i].changed(midiChanged);
        midiSelect[i].hide();

        buffSelect[i] = p.createSelect();
        buffSelect[i].position(170, 550);
        buffSelect[i].option('Garden', 0);
        buffSelect[i].option('Birds', 1);
        buffSelect[i].option('Meanwood', 2);
        buffSelect[i].option('Ancra', 3);
        buffSelect[i].option('Feedbackclick', 4);
        buffSelect[i].option('Hardwet', 5);
        buffSelect[i].option('Intiband', 6);
        buffSelect[i].option('User', 7);
        buffSelect[i].changed(buffChanged);
        buffSelect[i].hide();

        midiVol[i] = p.createSlider(0, 1, 1, 0.01);
        midiVol[i].position(65, 580);
        midiVol[i].size(90);
        midiVol[i].hide();

        buffVol[i] = p.createSlider(0, 1, 1, 0.01);
        buffVol[i].position(175, 580);
        buffVol[i].size(90);
        buffVol[i].hide();

				scaleSelect[i] = p.createSelect();
        scaleSelect[i].position(70, 620);
				scaleSelect[i].option('Major', 0);
				scaleSelect[i].option('Minor', 1);
				scaleSelect[i].option('Iwato', 2);
				scaleSelect[i].option('Pentatonic', 3);
				scaleSelect[i].option('Niavent', 4);
				scaleSelect[i].option('Blues', 5);
				scaleSelect[i].changed(scaleChanged);
				scaleSelect[i].hide();

				loadFile[i] = p.createFileInput(processFile);
				loadFile[i].position(180, 618);
				loadFile[i].hide();
  }

    // Create a slider and place it at the top of the canvas.
    slider = p.createSlider(0, 1, 1, 0.01);
    slider.position(50, 360);
    slider.size(230);
		slider.hide();
  }

	function processFile(file) {
		//const objectURL = URL.createObjectURL(file);
		console.log("Loaded: " + file.name + " " + file.type + " " + file.data);
		const sound = p.loadSound(file, onceLoaded);
	}

	function onceLoaded(e){
				//e.play();
				const reader = new FileReader();
				reader.readAsArrayBuffer(e.getBlob());
				//console.log("LOADING", reader.readyState); // readyState will be 1

				reader.onloadend = () => {
				  console.log("Data File Loaded", reader.readyState); // readyState will be 2
					// Decode the received Data as an AudioBuffer
					const audioBuf = context.decodeAudioData(reader.result, twiceLoaded);
				};
	}

	function twiceLoaded(buffer) {
			console.log("Audio File Loaded"); // readyState will be 2
						device[current_sensor].setDataBuffer(bufferId, buffer);
	}

  function midiChanged() {
    //let midiSelection = midiSelect[current_sensor].value();
    //var retVal = midiSelection.split(' ');
    console.log('set midi on sensor '+sensor_nums[current_sensor]+' '+midiSelect[current_sensor].selected());
    sendToMax(current_sensor, "midi_inst", midiSelect[current_sensor].value());
  }

  function buffChanged(index) {
    //let buffSelection = buffSelect[current_sensor].value();
    //var retVal = buffSelection.split(' ');
    console.log('set buff on sensor '+sensor_nums[current_sensor]+' '+buffSelect[current_sensor].value());
    sendToMax(current_sensor, "buff_inst", buffSelect[current_sensor].value());
  }

	function scaleChanged(index) {
		//let buffSelection = buffSelect[current_sensor].value();
		//var retVal = buffSelection.split(' ');
		console.log('set scale on sensor '+sensor_nums[current_sensor]+' '+scaleSelect[current_sensor].value());
		sendToMax(current_sensor, "scale", scaleSelect[current_sensor].value());
	}

  function drawInstructions(){

    // make input box
    p.strokeWeight(2);
    p.stroke(p.color(0, 102, 153));
    p.line(30, 100, 300, 100);
    p.line(30, 400, 300, 400);
    p.line(30, 700, 300, 700);
    p.line(30, 100, 30, 700);
    p.line(300, 100, 300, 700);

    p.textSize(16);
    p.fill(0, 102, 153);
    p.strokeWeight(0);
    p.textAlign(p.LEFT, p.CENTER);
    p.text('master volume', 110, 345);

		p.textAlign(p.LEFT, p.TOP);
		p.text('1. Click on centre circle to switch on the audio \n\n2. Click on the sensor number to connect and access the settings for each sensor \n\n3. Click on the grey squares below to turn on midi or buffer instrument', 50, 120, 240, 430);

  }


    function drawSensorSettings(){

      if(current_sensor!=null){
        // make input box
        p.textSize(24);
        p.fill(0, 102, 153);
        p.strokeWeight(0);
        p.textAlign(p.CENTER, p.CENTER);
				//console.log(sensor_nums[current_sensor]);
        p.text('sensor '+sensor_nums[current_sensor], 165, 430);

        //p.noFill();
        if(midiOn[current_sensor]) p.fill(0, 202, 53);
        else p.fill(50, 0, 0);
        p.rect(75, 460, 70, 70);

        if(buffOn[current_sensor]) p.fill(0, 202, 53);
        else p.fill(50, 0, 0);
        p.rect(185, 460, 70, 70);
      }

    }

  function getInputs(){
    // Use the slider as a grayscale value.
      let g = slider.value();
      //if(g!=0) sendToMax("volume",Number(g));
      setVolume(g);

      if(current_sensor!=null) {
        g = midiVol[current_sensor].value();
        sendToMax(current_sensor, "midi_vol", g);

        g = buffVol[current_sensor].value();
        sendToMax(current_sensor, "buff_vol", g);
      }

  }

  p.mousePressed = function() {

		if (loading==num_sensors) {   // No mouse press until all devices loaded

	    for(i=0; i<num_sensors; i++) {
	      let x = 100+250*p.sin(i*(p.TWO_PI/num_sensors)); //calculate xPos
	      let y = 250*p.cos(i*(p.TWO_PI/num_sensors)); //calculate yPos
	      //console.log('mouse clicked at x:'+p.mouseX+' y:'+p.mouseY);
	      if(p.mouseX>(((innerWidth/2)+x)-50) && p.mouseX<(((innerWidth/2)+x)+50) && p.mouseY>(((innerHeight/2)-y)-50) && p.mouseY<(((innerHeight/2)-y)+50)) {
	        //console.log('mouse clicked in circle '+ i);
	        if(current_sensor) {
	          midiSelect[current_sensor].hide();   //hide the previous sensor selectors
	          buffSelect[current_sensor].hide();
	          midiVol[current_sensor].hide();
	          buffVol[current_sensor].hide();
						scaleSelect[current_sensor].hide();
						loadFile[current_sensor].hide();
	        }
	        current_sensor=i;
	        console.log("Sensor selected: "+sensor_nums[i]);
	        //console.log(midiSelect[current_sensor].selected());
	        connectAndStartNotify(i);

	        midiSelect[current_sensor].show();
	        midiSelect[current_sensor].value(midiSelect[current_sensor].value());
	        buffSelect[current_sensor].show();
	        buffSelect[current_sensor].value(buffSelect[current_sensor].value());
	        midiVol[current_sensor].show();
	        buffVol[current_sensor].show();
					scaleSelect[current_sensor].show();
					scaleSelect[current_sensor].value(scaleSelect[current_sensor].value());
					loadFile[current_sensor].show();
	      };
	    }

	    if(p.mouseX>((100+innerWidth/2)-innerHeight/12) && p.mouseX<((100+innerWidth/2)+innerHeight/12) && p.mouseY>((innerHeight/2)-innerHeight/12) && p.mouseY<((innerHeight/2)+innerHeight/12)) {
	      //console.log("mouse clicked in centre circle");
	      startAudio();
				slider.show();
	    };

	    if(p.mouseX>80&&p.mouseX<150&&p.mouseY>460&&p.mouseY<530) {
	      if(midiOn[current_sensor]==0) {
	        console.log('midi on '+sensor_nums[current_sensor]);
	        sendToMax(current_sensor, "midi_on", 1);
	        midiOn[current_sensor]=1;
	      } else {
	        console.log('midi off '+sensor_nums[current_sensor]);
	        sendToMax(current_sensor, "midi_on", 0);
	        midiOn[current_sensor]=0;
	      }
	      //sendToMax('midi_on')
	    }
	    if(p.mouseX>180&&p.mouseX<250&&p.mouseY>460&&p.mouseY<530) {
	      if(buffOn[current_sensor]==0) {
	        console.log('buff on '+sensor_nums[current_sensor]);
	        sendToMax(current_sensor, "buff_on", 1);
	        buffOn[current_sensor]=1;
	      } else {
	        console.log('buff off '+sensor_nums[current_sensor]);
	        sendToMax(current_sensor, "buff_on", 0);
	        buffOn[current_sensor]=0;
	      }
	    }
		}
  }
};

let myp5 = new p5(s);

const context = new (window.AudioContext || window.webkitAudioContext)();
const outputNode = context.createGain();
//var device = [];
let device = [];

async function main() { // Note that main is an async function to support async / await
  try {
    // Create AudioContext

    // Create gain node and connect it to audio output for overall volume control
    outputNode.connect(context.destination);
    outputNode.gain.setValueAtTime(0, context.currentTime);

    let dependencies = [];
    try {
        const dependenciesResponse = await fetch("export/dependencies.json");
        dependencies = await dependenciesResponse.json();

        // Prepend "export" to any file dependenciies
        dependencies = dependencies.map(d => d.file ? Object.assign({}, d, { file: "export/" + d.file }) : d);
    } catch (e) {}


    // RNBO Device Setup
		for (var i=0; i<num_sensors; i++) {

			console.log("Creating RNBO device " + i);

			const patcherResponse = await fetch("export/echome.export.json");
			const patcher = await patcherResponse.json();

			device[i] = await RNBO.createDevice({ context, patcher });

			const results = await device[i].loadDataBufferDependencies(dependencies);

			results.forEach(result => {
    	if (result.type === "success") {
        console.log(`Successfully loaded buffer with id ${result.id}`);
    	} else {
        console.log(`Failed to load buffer with id ${result.id}, ${result.error}`);
    	}
			});


//			if (dependencies.length)
//	        await device[0].loadDataBufferDependencies(dependencies);
			device[i].node.connect(outputNode);

	  	device[i].parameters.forEach(parameter => {
			      console.log(parameter.name);
			});

			loading+=1;
			console.log("Loaded " + loading + " out of " + num_sensors);
		}





  } catch (err) {
    console.log(err);
    const errDisplay = document.createElement("div");
    errDisplay.style.color = "red";
    errDisplay.innerHTML = `Encountered Error: <pre><code>${err.message}</pre></code>Check your console for more details.`;
    document.body.appendChild(errDisplay);
  }
}


function startAudio(){
        if (context.state !== "running") context.resume();
        else context.suspend();
}


function setVolume(e){
    outputNode.gain.setValueAtTime(parseFloat(e), context.currentTime);
}

function sendToMax(sensor, param, val) {
  const myparam = device[sensor].parametersById.get(param);
  //console.log(param+val);
  myparam.value = (val);
}
