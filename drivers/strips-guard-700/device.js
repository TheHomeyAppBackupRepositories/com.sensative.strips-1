'use strict';

const StripsZwaveDevice = require("../StripsZwaveDevice");

class StripsGuard700 extends StripsZwaveDevice {

  /**
   * onInit is called when the device is initialized.
   */
  async onNodeInit({ node }) {
    this.log('StripsGuard700 device has been initialized');    

    // enable debugging
    this.enableDebug();

    // print the node's info to the console
    this.printNode();
   
    const settings = this.getSettings();
    this.log(settings.username);
    this.registerCapability("alarm_contact", "NOTIFICATION");
    await this.registerDynamicCapabilities(settings, true);
    this.registerBatteryCapabilities();
    this.updateMaintenanceActionRegistrations();
  }

  determineCapabilityIds(settings) {
    const capabilities = super.determineCapabilityIds(settings);
    capabilities.unshift("alarm_contact");
    return capabilities;
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('StripsGuard700 device has been added');
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
    this.log('StripsGuard700 device settings were changed');

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
  this.log('StripsGuard700 device was renamed');
 }

 /**
  * onDeleted is called when the user deleted the device.
  */
 async onDeleted() {
  this.log('StripsGuard700 device has been deleted');
 }

 async registerDynamicCapabilities(settings, initializing) {
    const addedCapabilities = await this.ensureCapabilitiesMatch(
      this.determineCapabilityIds(settings)
    );
    const capabilities = initializing
      ? this.getCapabilities()
      : addedCapabilities;

    if (capabilities.includes("alarm_tamper")) {
      this.registerTamperAlarmCapability();
    }
  }

  updateMaintenanceActionRegistrations() {
    const maintenanceActions = {
      "button.reset_tamper_alarm": () =>
        this.setCapabilityValue("alarm_tamper", false),
    };

    this.registerMaintenanceActions(maintenanceActions);
  }
}

module.exports = StripsGuard700;
