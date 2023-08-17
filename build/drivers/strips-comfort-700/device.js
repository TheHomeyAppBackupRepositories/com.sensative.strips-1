'use strict';

const StripsZwaveDevice = require("../StripsZwaveDevice");

function luminanceReportParser(report) {
  const isLuminanceReport =
    report &&
    report.hasOwnProperty("Sensor Type") &&
    report.hasOwnProperty("Sensor Value (Parsed)") &&
    report["Sensor Type"] === "Luminance (version 1)";

  if (!isLuminanceReport) return null;

  const sensorValue = report["Sensor Value (Parsed)"];

  return sensorValue;
}

class StripsComfort700 extends StripsZwaveDevice {

  /**
   * onInit is called when the device is initialized.
   */
  async onNodeInit({ node }) {
    this.log('MyDevice has been initialized');

    // enable debugging
    this.enableDebug();

    // print the node's info to the console
    this.printNode();

    this.registerTemperatureCapability();    
    this.registerHeatAlarmCapability();    

    
    // register a settings parser for parameter 10 & 11.
    this.registerSetting('light_high', value => (value === true ? 0 : ( ( (value > 0) && (value <= 20) ) ? 20 : value)));
    this.registerSetting('light_low', value => (value === true ? 0 : ( ( (value > 0) && (value <= 10) ) ? 10 : value)));

    const settings = this.getSettings();
    this.registerDynamicCapabilities(settings, true);
    this.updateMaintenanceActionRegistrations();    

    node.CommandClass.COMMAND_CLASS_CENTRAL_SCENE.on("report", (command, report) => {
      let device = this;
      let tokens = {};
      let state = {};

      this.driver.ready().then(() => {
        this.driver.triggerStripsFlow(report["Scene Number"], device, tokens, state);
      });      
    });
  }

  determineCapabilityIds(settings) {
    const capabilities = [];

    capabilities.push('measure_temperature', 'alarm_heat');
    if (settings.maintenance_actions) {
      capabilities.push('button.reset_heat_alarm');
    }
    capabilities.push('measure_luminance');    
    capabilities.push('measure_humidity');
    
    return capabilities.concat(super.determineCapabilityIds(settings));
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
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
    this.log('MyDevice settings where changed');

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
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
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
        if (report['Sensor Type'] === 'Relative humidity (version 2)') {
          return report['Sensor Value (Parsed)'];
        }
        return null;
      },
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

    if (capabilities.includes('alarm_tamper')) {
      this.registerTamperAlarmCapability();
    }
  }

  updateMaintenanceActionRegistrations() {
    const maintenanceActions = {
      'button.reset_heat_alarm': () => this.setCapabilityValue('alarm_heat', false),
      'button.reset_tamper_alarm': () => this.setCapabilityValue('alarm_tamper', false)
    };

    this.registerMaintenanceActions(maintenanceActions);
  }
}

module.exports = StripsComfort700;
