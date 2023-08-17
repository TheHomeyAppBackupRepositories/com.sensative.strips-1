'use strict';

const StripsZwaveDevice = require("../StripsZwaveDevice");

class StripsDrip700 extends StripsZwaveDevice {

  /**
   * onInit is called when the device is initialized.
   */
  async onNodeInit({ node }) {
    this.log('StripsDrip700 device has been initialized');
    
    // enable debugging
    this.enableDebug();

    // print the node's info to the console
    this.printNode();
        
    this.registerTemperatureCapability();
    this.registerHeatAlarmCapability();

    const settings = this.getSettings();
    this.registerDynamicCapabilities(settings, true);
    this.updateMaintenanceActionRegistrations();    

    node.CommandClass.COMMAND_CLASS_CONFIGURATION.on("report", (command, report) => {
      if (report['Parameter Number'] === 23) {        
        this.setSettings({
          leakage_sensor_calibration: "0"      
        });
      this.log('Perform Calibration done!');
      } 
    });
  }

  determineCapabilityIds(settings) {
    const capabilities = [];

    capabilities.push('measure_humidity', 'alarm_water');
    if (settings.maintenance_actions) {
      capabilities.push('button.reset_water_alarm');
    }

    capabilities.push('measure_temperature', 'alarm_heat');
    if (settings.maintenance_actions) {
      capabilities.push('button.reset_heat_alarm');
    }    

    return capabilities.concat(super.determineCapabilityIds(settings));
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('StripsDrip700 device has been added');
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
    this.log('StripsDrip700 device settings where changed');
    
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
    this.log('StripsDrip700 device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('StripsDrip700 device has been deleted');
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

  registerMositureCapability() {
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

    if (capabilities.includes('measure_humidity')) {
      this.registerMositureCapability();
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
      'button.reset_water_alarm': () => this.setCapabilityValue('alarm_water', false),
      'button.reset_heat_alarm': () => this.setCapabilityValue('alarm_heat', false),      
      'button.reset_tamper_alarm': () => this.setCapabilityValue('alarm_tamper', false)
    };

    this.registerMaintenanceActions(maintenanceActions);
  }
}

module.exports = StripsDrip700;
