'use strict';

const fs = require('fs');
const Protocol = require('azure-iot-device-mqtt').Mqtt;
const Message = require('azure-iot-device').Message;
const Client = require('azure-iot-device').Client;

const connectionStringEnv = process.env.AZURE_IOT_CONN_STRING;
const certFile = 'certs/device0-cert.pem';
const keyFile = 'certs/device0-key.pem';

let client;

/**
 * Prints the results of an async operation.
 * '
 * @param {*} operation 
 */
function printResultFor(operation) {
  return function printResult(err, res) {
    if (err) console.log(operation + ' error: ' + err.toString());
    if (res) console.log(operation + ' status: ' + res.constructor.name);
  };
}

/**
 * This function is an example of a direct method that we've made callable from the IoT hub.
 */
function onFirmwareUpdate() {
  console.log(request.payload.firmwareUrl);
  // TODO: Implement firmware update logic.

  console.log(request);
}

/**
 * This function simulates a client and updates a device twin in the IoT hub.
 * 
 * @param {*} status 
 */
function updateTwinStatus(status) {
  console.log('Retrieving device twin.');

  const statusUpdate = {
    status: 'normal'
  };

  client.getTwin((err, twin) => {
    if (err) {
      console.log('Could not get twin: ' + err.message);
    }

    const datedPatch = Object.assign({}, statusUpdate, {statusUpdated: Date.now()}); 
    console.log('Retrieved twin and patching with: ', datedPatch);

    twin.properties.reported.update(datedPatch, (err) => {
      if (err) {
        console.log('Error while updating twin.', err);
      } else {
        console.log('Twin updated without error.');
      }
    });
  });
}

/**
 * This callback is fired after a connection is made (or fails).
 * 
 * @param {*} err 
 */
function connectCallback (err) {
  if (err) {
    console.log('Could not connect: ' + err);
  } else {
    console.log('Client connected');

    // Registers a direct method that is callable from the IoT hub.
    client.onDeviceMethod('firmwareUpdate', onFirmwareUpdate);

    // Update twin status on connection.
    updateTwinStatus('connected');

    // Create a message and send it to the IoT Hub on an interval.
    setInterval(function(){
        var temperature = 20 + (Math.random() * 15);
        var humidity = 60 + (Math.random() * 20);            
        var data = JSON.stringify({ deviceId: 'simulatedNodeDevice', temperature: temperature, humidity: humidity });
        var message = new Message(data);
        message.properties.add('temperatureAlert', (temperature > 30) ? 'true' : 'false');
        console.log("Sending message: " + message.getData());
        client.sendEvent(message, printResultFor('send'));
    }, 60000);
  }
};

/**
 * Connects the simulated device to the IoT hub.
 */
function connectDevice() {
  client = Client.fromConnectionString(connectionStringEnv, Protocol);
  const options = {
      cert: fs.readFileSync(certFile, 'utf-8').toString(),
      key: fs.readFileSync(keyFile, 'utf-8').toString()
    };

  client.setOptions(options);
  client.open(connectCallback);
};


connectDevice();

