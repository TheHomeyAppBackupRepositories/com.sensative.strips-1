'use strict';

const Homey = require('homey');

class StripsApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Strips App has been initialized');
  }

}

module.exports = StripsApp;