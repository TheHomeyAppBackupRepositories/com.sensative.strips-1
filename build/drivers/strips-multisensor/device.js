'use strict';

const StripsZwaveDevice = require('../StripsZwaveDevice');

function luminanceReportParser(report) {
  const isLuminanceReport =
    report &&
    report.hasOwnProperty('Sensor Type') &&
    report.hasOwnProperty('Sensor Value (Parsed)') &&
    report['Sensor Type'] === 'Luminance (version 1)';

  if (!isLuminanceReport) return null;

  const sensorValue = report['Sensor Value (Parsed)'];

  if (sensorValue < 0) {
    // Early firmwares of Strips Comfort mistakenly use a 16-bit integer to represent the luminance value.
    // Z-Wave only supports signed integers, but the value was intended as unsigned.
    // This should work around that issue, since a lux value can never be negative anyway.
    return 65536 + sensorValue;
  }

  return sensorValue;
}

class StripsMultiSensor extends StripsZwaveDevice {

  /**
   * onInit is called when the device is initialized.
   */
   async onNodeInit({ node }) {
    this.log('StripsMultiSensor has been initialized');

    this.registerTemperatureCapability();
    this.registerHeatAlarmCapability();

    const settings = this.getSettings();
    this.registerDynamicCapabilities(settings, true);
    this.updateMaintenanceActionRegistrations();
  }

  determineCapabilityIds(settings) {
    const capabilities = [];

    capabilities.push('measure_temperature', 'alarm_heat');
    if (settings.maintenance_actions) {
      capabilities.push('button.reset_heat_alarm');
    }

    if (settings.device_type !== 'drip') {
      capabilities.push('measure_luminance');
    }

    if (settings.device_type !== 'comfort') {
      capabilities.push('measure_humidity', 'alarm_water');
      if (settings.maintenance_actions) {
        capabilities.push('button.reset_water_alarm');
      }
    }

    return capabilities.concat(super.determineCapabilityIds(settings));
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('StripsMultiSensor has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('StripsMultiSensor settings where changed');

    let result = await super.onSettings({
      oldSettings,
      newSettings,
      changedKeys
    });

    return result;
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('StripsMultiSensor was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('StripsMultiSensor has been deleted');
  }

  registerTemperatureCapability() {
    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
      getOpts: {
        getOnOnline: false,
      },
    });
  }

  registerHeatAlarmCapability() {
    this.registerCapability('alarm_heat', 'NOTIFICATION', {
      reportParser: report => { 
        if (report['Notification Type'] === 'Heat') {
          switch (report['Event']) {
            case 2: // Overheat
            case 6: // Underheat
              return true;
            case 0: // Heat alarm OFF
              return false;
          }
        }

        return null;
      },
      getOpts: {
        getOnOnline: false,
      },
    });
  }  

  registerLuminanceCapability() {
    this.registerCapability('measure_luminance', 'SENSOR_MULTILEVEL', {
      reportParser: luminanceReportParser,
      getOpts: {
        getOnOnline: false,
      },
    });
  }

  registerHumidityCapability() {
    this.registerCapability('measure_humidity', 'SENSOR_MULTILEVEL', {
      reportParser: report => {
        if (report['Sensor Type'] === 'Moisture (v5)') {
          return report['Sensor Value (Parsed)'];
        }
        return null;
      },
      getOpts: {
        getOnOnline: false,
      },
    });
  }

  registerWaterAlarmCapability() {
    this.registerCapability('alarm_water', 'NOTIFICATION', {
      getOpts: {
        getOnOnline: false,
      },
    });
  }

  async registerDynamicCapabilities(settings, initializing) {
    const addedCapabilities = await this.ensureCapabilitiesMatch(this.determineCapabilityIds(settings));
    const capabilities = initializing ? this.getCapabilities() : addedCapabilities;

    if (capabilities.includes('measure_luminance')) {
      this.registerLuminanceCapability();
    }

    if (capabilities.includes('measure_humidity')) {
      this.registerHumidityCapability();
    }

    if (capabilities.includes('alarm_water')) {
      this.registerWaterAlarmCapability();
    }

    if (capabilities.includes('alarm_tamper')) {
      this.registerTamperAlarmCapability();
    }
  }

  updateMaintenanceActionRegistrations() {
    const maintenanceActions = {
      'button.reset_heat_alarm': () => this.setCapabilityValue('alarm_heat', false),
      'button.reset_water_alarm': () => this.setCapabilityValue('alarm_water', false),
      'button.reset_tamper_alarm': () => this.setCapabilityValue('alarm_tamper', false)
    };

    this.registerMaintenanceActions(maintenanceActions);
  }
}

module.exports = StripsMultiSensor;
