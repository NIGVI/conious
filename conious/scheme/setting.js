

class Setting {

  constructor(setting) {
    this.setting = setting
  }

}

function setSetting(setting) {
  return new Setting(setting)
}

module.exports = {
  Setting,
  setSetting
}