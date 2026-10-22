
var num_sensors;
var current_sensor;
var sensor_nums = [];
var gotChars=[];

var handlePitches = [];
var handleRolls = [];
var handleYaws = [];
var handleData = [];

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
	data:"7e400002-b5a3-f393-e0a9-e50e24dcca9e"
}

let pitchCharacteristic=[];
let rollCharacteristic=[];
let yawCharacteristic=[];
let dataCharacteristic=[];

// Sensor values for each sensor
let sensorData = [];

const ACCEL_MAX = 3.0;       // ±2 g
const GYRO_MAX = 2000.0;    // ±2000 degrees/sec




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
					}else if(characteristics[j].uuid == characteristicsUUID.data){
						dataCharacteristic[sensor_nums[i]-1] = characteristics[j];
						//myBLE[i].startNotifications(dataCharacteristic[sensor_nums[i]-1], handleData[i]);
						myBLE[i].startNotifications(dataCharacteristic[sensor_nums[i]-1], handleData[i], "custom");

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
		handleData[i] = function(data) {

		    //console.log("IMU DATA:", data);
		    //console.log("TYPE:", typeof data);
		    //console.log("CONSTRUCTOR:", data?.constructor?.name);
		    //console.log("BYTE LENGTH:", data?.byteLength);

		    const imu = decodeIMU(data);

		    if (!imu) return;

			sensorData[i].gyroX = imu.gyroX;
			sensorData[i].gyroY = imu.gyroY;
			sensorData[i].gyroZ = imu.gyroZ;

			sensorData[i].accelX = imu.accelX;
			sensorData[i].accelY = imu.accelY;
			sensorData[i].accelZ = imu.accelZ;

			sensorData[i].buttonA = imu.buttonA;

			sendToMax(i, "accelX", imu.accelX);
			sendToMax(i, "accelY", imu.accelY);
			sendToMax(i, "accelZ", imu.accelZ);

			sendToMax(i, "gyroX", imu.gyroX);
			sendToMax(i, "gyroY", imu.gyroY);
			sendToMax(i, "gyroZ", imu.gyroZ);

			sendToMax(i, "buttonA", imu.buttonA);
		    //sendToMax(i, "timestamp", imu.timestamp);
		};

}

function decodeIMU(data) {

    let view;

    if (data instanceof DataView) {
        view = data;
    }
    else if (data instanceof ArrayBuffer) {
        view = new DataView(data);
    }
    else if (data instanceof Uint8Array) {
        view = new DataView(
            data.buffer,
            data.byteOffset,
            data.byteLength
        );
    }
    else {
        console.error("Unexpected IMU data:", data);
        return null;
    }

    if (view.byteLength < 17) {
        console.error(
            "IMU packet is only",
            view.byteLength,
            "bytes; expected 17"
        );
        return null;
    }

    const timestamp = view.getUint32(0, true);

    const accelX = view.getInt16(4, true) / 1000.0;
    const accelY = view.getInt16(6, true) / 1000.0;
    const accelZ = view.getInt16(8, true) / 1000.0;

    const gyroX = view.getInt16(10, true) / 10.0;
    const gyroY = view.getInt16(12, true) / 10.0;
    const gyroZ = view.getInt16(14, true) / 10.0;

    // Front blue button: 1 = pressed, 0 = released
    const buttonA = view.getUint8(16);

    return {
        timestamp,
        accelX,
        accelY,
        accelZ,
        gyroX,
        gyroY,
        gyroZ,
        buttonA
    };
}



function checkBrowser(){

  //const Bowser = require("bowser"); // CommonJS
  const browser = bowser.getParser(window.navigator.userAgent);
  console.log(`The current browser name is "${browser.getBrowserName()}"`);

  if((browser.getBrowserName())!='Chrome') {
		alert("Unsupported browser...");
	}
  var retVal = prompt("Enter sensor numbers seperated by a space", "eg 1 2 3");
  console.log("Creating buttons for sensor ", retVal);
  if (retVal==null || retVal==("eg 1 2 3")) {
    sensor_nums=null;
    num_sensors=0;
  } else {
    sensor_nums = retVal.split(' ')
    num_sensors=sensor_nums.length;
  }
}

function connectAndStartNotify(index) {

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
		  // Reposition the existing controls
  		repositionInputs();
		  // Redraw using the new dimensions
  		p.redraw();
	}


	p.setup = function() {

		p.createCanvas(innerWidth, innerHeight);

    checkBrowser();

    main();
		//connectXebra();

	for (let i=0; i<num_sensors; i++) {
	    connectSensor(i);
	    midiOn[i]=0;
	    buffOn[i]=0;
		sensorData[i] = {
	        accelX: 0,
	        accelY: 0,
	        accelZ: 0,
	        gyroX: 0,
	        gyroY: 0,
	        gyroZ: 0,
			buttonA: 0
	    };
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
			p.rect(innerWidth/4, innerHeight/4, innerWidth/2, innerHeight/2);

			p.textSize(24);
			p.fill(0, 102, 153);
			p.textAlign(p.CENTER, p.CENTER);
			p.text('Loading sounds and instruments for sensor '+ (loading+1)+' out of '+num_sensors, innerWidth/2, (innerHeight/2)-70);

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
      p.translate((innerWidth/2), -50+innerHeight/2);
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
	  //p.pop();
  }

function drawSensors(){

    for(let i = 0; i < num_sensors; i++){

        let x = 200 * p.sin(i * (p.TWO_PI / num_sensors));
        let y = 200 * p.cos(i * (p.TWO_PI / num_sensors));

        p.push();
        p.translate(x, -y);

        // -------------------------
        // Sensor circle
        // -------------------------

		p.fill(0,0,0);

        if(myBLE[i].isConnected()){
            p.stroke(0, 255, 0);
        }else{
            p.stroke(255, 0, 0);
        }

        p.strokeWeight(2);
        p.circle(0, 0, 100);


        // -------------------------
        // Sensor number
        // -------------------------

        p.noStroke();
        p.fill(0, 102, 153);
        p.textSize(30);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(sensor_nums[i], 0, 0);


        // -------------------------
        // Draw sensor display lines
        // -------------------------

	drawCircularBar(
    	sensorData[i].accelX,
    	ACCEL_MAX,
    	43,
    	2
	);

	drawCircularBar(
	    sensorData[i].accelY,
	    ACCEL_MAX,
	    40,
	    2
	);

	drawCircularBar(
	    sensorData[i].accelZ,
	    ACCEL_MAX,
	    37,
	    2
	);
/*
	drawCircularBar(
	    sensorData[i].gyroX,
	    GYRO_MAX,
	    43,
	    2,
	    true
	);

	drawCircularBar(
	    sensorData[i].gyroY,
	    GYRO_MAX,
	    40,
	    2,
	    true
	);

	drawCircularBar(
	    sensorData[i].gyroZ,
	    GYRO_MAX,
	    37,
	    2,
	    true
	);
*/

        p.pop();
    }
	p.pop();
}

  function drawConnections() {
    for(i=0; i<num_sensors; i++) {
      let x = 200*p.sin(i*(p.TWO_PI/num_sensors)); //calculate xPos
      let y = 200*p.cos(i*(p.TWO_PI/num_sensors)); //calculate yPos
      p.strokeWeight(2);
      if((i<num_sensors)&&myBLE[i].isConnected()&&(context.state == "running")){
        p.stroke(p.color(0, 255, 0));
        p.line((innerWidth/2)+x, (innerHeight/2)-y-50, innerWidth/2, (innerHeight/2)-50);
        }else{
        p.stroke(p.color(255, 0, 0));
        p.line((innerWidth/2)+x, (innerHeight/2)-y-50, innerWidth/2, (innerHeight/2)-50);
      }

    }
  }

function getSensorLayout() {
  const margin = 10;
  const gap = 8;
  const bottomMargin = 20;

  const availableWidth = innerWidth - 2 * margin;

  // Limit box width to the width used when there are 4 sensors
  const maxBoxWidth =
    (availableWidth - gap * 3) / 4;

  const boxWidth = Math.min(
    maxBoxWidth,
    (availableWidth - gap * (num_sensors - 1)) / num_sensors
  );

  const boxHeight = Math.min(200, innerHeight * 0.3);
  const scale = Math.min(1, boxWidth / 200, boxHeight / 200);
  const boxY = innerHeight - boxHeight - bottomMargin;

  return {
    margin,
    gap,
    boxWidth,
    boxHeight,
    scale,
    boxY
  };
}

function drawInputs() {
  const { margin, gap, boxWidth, scale, boxY } = getSensorLayout();

  // Centre the group of sensor boxes
  const totalWidth =
    num_sensors * boxWidth + (num_sensors - 1) * gap;
  const startX = Math.max(margin, (innerWidth - totalWidth) / 2);

  for (let i = 0; i < num_sensors; i++) {
    const x = startX + i * (boxWidth + gap);
	  

    // Two columns, matching the indicator boxes
  	const padding = 5 * scale;
  	const colWidth = (boxWidth - 4 * padding) / 4;

	const leftX = x + boxWidth * 0.25 - colWidth / 2;
	const rightX = x + boxWidth * 0.75 - colWidth / 2;

    const controlHeight = 20 * scale;
    const rowGap = 5 * scale;

    // Controls start below the indicators
    const startY = boxY + 130 * scale;

    // MIDI instrument: left column
    midiSelect[i] = p.createSelect();
    midiSelect[i].position(leftX, startY);
    midiSelect[i].size(colWidth, controlHeight);
    midiSelect[i].option('Harp', 0);
    midiSelect[i].option('Piano', 1);
    midiSelect[i].option('Celesta', 2);
    midiSelect[i].option('Xylophone', 3);
    midiSelect[i].option('Cello', 4);
    midiSelect[i].option('Accordion', 5);
    midiSelect[i].option('Guitar', 6);
    midiSelect[i].option('Percussion', 7);
    midiSelect[i].changed(() => {
      current_sensor = i;
      midiChanged();
    });
    midiSelect[i].hide();

    // MIDI volume: left column
    midiVol[i] = p.createSlider(0, 1, 1, 0.01);
    midiVol[i].position(leftX, startY + controlHeight + rowGap);
    midiVol[i].size(colWidth);
    midiVol[i].hide();

    // Scale: left column
    scaleSelect[i] = p.createSelect();
    scaleSelect[i].position(
      leftX,
      startY + 2 * (controlHeight + rowGap)
    );
    scaleSelect[i].size(colWidth, controlHeight);
    scaleSelect[i].option('Major', 0);
    scaleSelect[i].option('Minor', 1);
    scaleSelect[i].option('Iwato', 2);
    scaleSelect[i].option('Pentatonic', 3);
    scaleSelect[i].option('Niavent', 4);
    scaleSelect[i].option('Blues', 5);
    scaleSelect[i].changed(() => {
      current_sensor = i;
      scaleChanged();
    });
    scaleSelect[i].hide();

    // Buffer selection: right column
    buffSelect[i] = p.createSelect();
    buffSelect[i].position(rightX, startY);
    buffSelect[i].size(colWidth, controlHeight);
    buffSelect[i].option('Garden', 0);
    buffSelect[i].option('Birds', 1);
    buffSelect[i].option('Meanwood', 2);
    buffSelect[i].option('Ancra', 3);
    buffSelect[i].option('Feedbackclick', 4);
    buffSelect[i].option('Hardwet', 5);
    buffSelect[i].option('Intiband', 6);
    buffSelect[i].option('User', 7);
    buffSelect[i].changed(() => {
      current_sensor = i;
      buffChanged();
    });
    buffSelect[i].hide();

    // Buffer volume: right column
    buffVol[i] = p.createSlider(0, 1, 1, 0.01);
    buffVol[i].position(rightX, startY + controlHeight + rowGap);
    buffVol[i].size(colWidth);
    buffVol[i].hide();

    // File upload: right column
    loadFile[i] = p.createFileInput(processFile);
    loadFile[i].position(
      rightX,
      startY + 2 * (controlHeight + rowGap)
    );
    loadFile[i].hide();
  }

   repositionInputs();
}

function repositionInputs() {
  const { margin, gap, boxWidth, scale, boxY } = getSensorLayout();

  // Match the centring used by drawSensorSettings()
  const totalWidth =
    num_sensors * boxWidth + (num_sensors - 1) * gap;
  const startX = Math.max(margin, (innerWidth - totalWidth) / 2);

  for (let i = 0; i < num_sensors; i++) {
    const x = startX + i * (boxWidth + gap);

    const padding = 5 * scale;
    const colWidth = (boxWidth - 4 * padding) / 4;

    const leftX = x + boxWidth * 0.25 - colWidth / 2;
    const rightX = x + boxWidth * 0.75 - colWidth / 2;

    const controlHeight = 20 * scale;
    const rowGap = 5 * scale;
    const startY = boxY + 130 * scale;

    midiSelect[i].position(leftX, startY);
    midiSelect[i].size(colWidth, controlHeight);

    midiVol[i].position(leftX, startY + controlHeight + rowGap);
    midiVol[i].size(colWidth);

    scaleSelect[i].position(
      leftX, startY + 2 * (controlHeight + rowGap)
    );
    scaleSelect[i].size(colWidth, controlHeight);

    buffSelect[i].position(rightX, startY);
    buffSelect[i].size(colWidth, controlHeight);

    buffVol[i].position(rightX, startY + controlHeight + rowGap);
    buffVol[i].size(colWidth);

    loadFile[i].position(
      rightX, startY + 2 * (controlHeight + rowGap)
    );
  }
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
    p.line(innerWidth-330, 30, innerWidth-30, 30);
    p.line(innerWidth-330, 280, innerWidth-30, 280);
    //p.line(innerWidth-330, 700, innerWidth-30, 700);
    p.line(innerWidth-330, 30, innerWidth-330, 280);
    p.line(innerWidth-30, 30, innerWidth-30, 280);

    p.textSize(16);
    p.fill(0, 102, 153);
    p.strokeWeight(0);
    //p.textAlign(p.LEFT, p.CENTER);
    //p.text('master volume', 110, 345);

	p.textAlign(p.LEFT, p.TOP);
	p.text('1. Click on centre circle to switch on the audio \n\n2. Click on the sensor number to connect and access the settings for each sensor \n\n3. Click on the grey squares to turn on midi or buffer instrument', innerWidth-300, 50, 240, 430);

  }


function drawSensorSettings() {

  const { margin, gap, boxWidth, boxHeight, scale, boxY } =
    getSensorLayout();

  // Centre the group of boxes when there are fewer than 4 sensors
  const totalWidth =
    num_sensors * boxWidth + (num_sensors - 1) * gap;
  const startX = Math.max(margin, (innerWidth - totalWidth) / 2);

  p.strokeWeight(2);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24 * scale);

  for (let i = 0; i < num_sensors; i++) {

    const x = startX + i * (boxWidth + gap);

    // Box outline
    p.stroke(p.color(0, 102, 153));
    p.noFill();
    p.rect(x, boxY, boxWidth, boxHeight);

    // Sensor label
    p.noStroke();
    p.fill(0, 102, 153);
    p.text(
      'sensor ' + sensor_nums[i],
      x + boxWidth / 2,
      boxY + 20 * scale
    );

    // Indicator dimensions and positions
    const indicatorSize = Math.min(50 * scale, boxWidth * 0.3);
    const indicatorY = boxY + 50 * scale;
    const indicatorGap = 10 * scale;
    const totalIndicatorsWidth =
      2 * indicatorSize + indicatorGap;
    const firstIndicatorX =
      x + (boxWidth - totalIndicatorsWidth) / 2;

    // MIDI indicator
    p.fill(midiOn[i] ? p.color(0, 202, 53) : p.color(50, 0, 0));
    p.rect(
      firstIndicatorX,
      indicatorY,
      indicatorSize,
      indicatorSize
    );

    // Buffer indicator
    p.fill(buffOn[i] ? p.color(0, 202, 53) : p.color(50, 0, 0));
    p.rect(
      firstIndicatorX + indicatorSize + indicatorGap,
      indicatorY,
      indicatorSize,
      indicatorSize
    );
  }
}

  function getInputs(){
    // Use the slider as a grayscale value.
      //let g = slider.value();
      //if(g!=0) sendToMax("volume",Number(g));
      //setVolume(g);

      if(current_sensor!=null) {
        g = midiVol[current_sensor].value();
        sendToMax(current_sensor, "midi_vol", g);

        g = buffVol[current_sensor].value();
        sendToMax(current_sensor, "buff_vol", g);
      }

  }

function drawCircularBar(value, maxValue, radius, thickness, bottom = false){

    value = p.constrain(value, -maxValue, maxValue);

    // Normalise to -1 ... +1
    let amount = value / maxValue;

    // Maximum sweep is 180 degrees
    let sweep = amount * p.PI;

    let zeroAngle;

    if(bottom){
        // Zero at 6 o'clock
        zeroAngle = p.HALF_PI;
    }else{
        // Zero at 12 o'clock
        zeroAngle = -p.HALF_PI;
    }

    p.noFill();

    if(bottom){
        p.stroke(180, 80, 80);
    }else{
        p.stroke(80, 120, 200);
    }

    p.strokeWeight(thickness);

	if(sweep>0){
    p.arc(
        0,
        0,
        radius * 2,
        radius * 2,
        zeroAngle,
        zeroAngle + sweep
    );
	} else{
	p.arc(
        0,
        0,
        radius * 2,
        radius * 2,
        zeroAngle + sweep,
        zeroAngle
    );
	}
}

  p.mousePressed = function() {

		if (loading==num_sensors) {   // No mouse press until all devices loaded

	    for(i=0; i<num_sensors; i++) {
	      let x = 200*p.sin(i*(p.TWO_PI/num_sensors)); //calculate xPos
	      let y = 200*p.cos(i*(p.TWO_PI/num_sensors)); //calculate yPos
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

	    if(p.mouseX>((innerWidth/2)-innerHeight/12) && p.mouseX<((innerWidth/2)+innerHeight/12) && p.mouseY>((innerHeight/2)-innerHeight/12) && p.mouseY<((innerHeight/2)+innerHeight/12)) {
	      console.log("Starting Audio");
	      startAudio();
		  //slider.show();
		  //sendToMax("volume",1.0);
      	  setVolume(1.0);
	    };

		  const { margin, gap, boxWidth, scale, boxY } = getSensorLayout();
		
		  // Centre the group of sensor boxes
		  const totalWidth =
		    num_sensors * boxWidth + (num_sensors - 1) * gap;
		  const startX = Math.max(margin, (innerWidth - totalWidth) / 2);
		
		  for (let i = 0; i < num_sensors; i++) {
		    const x = startX + i * (boxWidth + gap);
			


			
		
		  const indicatorSize = Math.min(50 * scale, boxWidth * 0.3);
		  const indicatorY = boxY + 50 * scale;
		  const indicatorGap = 10 * scale;
		  const totalIndicatorsWidth = 2 * indicatorSize + indicatorGap;
		  const firstIndicatorX = x + (boxWidth - totalIndicatorsWidth) / 2;
		
		  // MIDI indicator: left square
		  if (
		    p.mouseX >= firstIndicatorX &&
		    p.mouseX <= firstIndicatorX + indicatorSize &&
		    p.mouseY >= indicatorY &&
		    p.mouseY <= indicatorY + indicatorSize
		  ) {
		    midiOn[i] = midiOn[i] ? 0 : 1;
		
		    console.log(
		      'midi ' + (midiOn[i] ? 'on ' : 'off ') + sensor_nums[i]
		    );
		
		    sendToMax(i, "midi_on", midiOn[i]);
		    break;
		  }

	  // Buffer indicator: right square
	  const buffX = firstIndicatorX + indicatorSize + indicatorGap;

	  if (
	    p.mouseX >= buffX &&
	    p.mouseX <= buffX + indicatorSize &&
	    p.mouseY >= indicatorY &&
	    p.mouseY <= indicatorY + indicatorSize
	  ) {
	    buffOn[i] = buffOn[i] ? 0 : 1;
	
	    console.log(
	      'buff ' + (buffOn[i] ? 'on ' : 'off ') + sensor_nums[i]
	    );
	
	    sendToMax(i, "buff_on", buffOn[i]);
	    break;
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
		for (let i=0; i<num_sensors; i++) {

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

			const param = device[i].parametersById.get("midi_inst");
    		if (param) {
        		param.changeEvent.subscribe((value) => {
            	//console.log('Parameter changed on device ' + i + ': ' + value);
            	if (midiSelect[i]) {
                	midiSelect[i].selected(String(Math.round(value)));
            	}
        		});
    		}

			const param1 = device[i].parametersById.get("buff_inst");
    		if (param1) {
        		param1.changeEvent.subscribe((value) => {
            	//console.log('Parameter changed on device ' + i + ': ' + value);
            	if (buffSelect[i]) {
                	buffSelect[i].selected(String(Math.round(value)));
            	}
        		});
    		}
			
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
