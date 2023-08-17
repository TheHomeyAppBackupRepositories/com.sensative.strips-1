'use strict';

const StripsZwaveDevice = require("../StripsZwaveDevice");

const i18n = {
  settings: {
    notificationTypeChangedSaveMessage: {
      en: 'Notification type changed. In order to ensure continued proper operation, the Strips needs to be woken up manually.',
      nl: 'Notificatietype gewijzigd. Voor correct functioneren moet de Strips handmatig wakker gemaakt worden.'
    }
  }
};

class StripsGuard extends StripsZwaveDevice {

  /**
   * onInit is called when the device is initialized.
   */
   async onNodeInit({ node }) {
    this.log('StripsGuard has been initialized');

    // enable debugging
    this.enableDebug();

    // print the node's info to the console
    this.printNode();
   
    this.registerSetting('report_type', value => new Buffer([parseInt(value)]));
    this.registerSetting('led_indication', value => new Buffer([value ? 1 : 0]));

    const settings = this.getSettings();
    this.log(settings.username);
    this.registerAlarmContactCapability(settings.report_type);
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
    this.log('StripsGuard has been added');
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
    this.log('StripsGuard settings where changed');

    let result = await super.onSettings({
      oldSettings,
      newSettings,
      changedKeys
    });

    if (changedKeys.includes('report_type')) {
      this.registerAlarmContactCapability(newSettings.report_type);
      return i18n.settings.notificationTypeChangedSaveMessage;
    }
    
    return result;
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('StripsGuard was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('StripsGuard has been deleted');
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

  registerAlarmContactCapability(notificationType) {
    switch (notificationType) {
      case '0':
        this.log('Using SENSOR_BINARY command class');
        this.registerCapability('alarm_contact', 'SENSOR_BINARY');
        break;
      case '1':
        this.log('Using NOTIFICATION command class');
        this.registerCapability('alarm_contact', 'NOTIFICATION');
        break;
      default:
        this.log('No valid notification type set.');
        break;
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

module.exports = StripsGuard;
