'use strict';

const { Driver } = require('homey');

class StripsComfort700Driver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('StripsComfort700Driver has been initialized');

    //Flow Trigger Cards initialization
    this._deviceSliderSwitchOn = this.homey.flow.getDeviceTriggerCard('switch_on');
    this._deviceSliderSwitchOff = this.homey.flow.getDeviceTriggerCard('switch_off');
    this._deviceHighAmbientLightLevel = this.homey.flow.getDeviceTriggerCard('high_ambient_light_level_trigger');
    this._deviceLowAmbientLightLevel = this.homey.flow.getDeviceTriggerCard('low_ambient_light_level_trigger');
    this._deviceHighTemperatureAlarm = this.homey.flow.getDeviceTriggerCard('high_temperature_alarm');
    this._deviceLowTemperatureAlarm = this.homey.flow.getDeviceTriggerCard('low_temperature_alarm');
  }

  triggerStripsFlow(scene, device, tokens, state) {
    switch (scene) {
      case 1: // Slider switch on
      {
        this._deviceSliderSwitchOn
          .trigger(device, tokens, state)
          .then(this.log)
          .catch(this.error);
      }
      break;
      case 2: // Slider switch off  
      {
        this._deviceSliderSwitchOff
          .trigger(device, tokens, state)
          .then(this.log)
          .catch(this.error);          
      }
      break;
      case 3: // High ambient light (LUX) level trigger
      {
        this._deviceHighAmbientLightLevel
          .trigger(device, tokens, state)
          .then(this.log)
          .catch(this.error);        
      }
      break;
      case 4: // Low ambient light (LUX) level trigger
      {
        this._deviceLowAmbientLightLevel
          .trigger(device, tokens, state)
          .then(this.log)
          .catch(this.error);        
      }
      break;
      case 5: // High Temperature Alarm
      {
        this._deviceHighTemperatureAlarm
          .trigger(device, tokens, state)
          .then(this.log)
          .catch(this.error);        
      }
      break;
      case 6: // Low Temperature Alarm
      {
        this._deviceLowTemperatureAlarm
          .trigger(device, tokens, state)
          .then(this.log)
          .catch(this.error);        
      }
      break;
    }      
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [
      // Example device data, note that `store` is optional
      // {
      //   name: 'My Device',
      //   data: {
      //     id: 'my-device',
      //   },
      //   store: {
      //     address: '127.0.0.1',
      //   },
      // },
    ];
  }

}

module.exports = StripsComfort700Driver;
