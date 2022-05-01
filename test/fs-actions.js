

const fs = require('fs/promises')
const path = require('path')
const downloadFolderPath = path.join(__dirname, 'servers', 'downloads')


module.exports = {

  async clearDownloadFolder() {
    await fs.rm(downloadFolderPath, { recursive: true })
  },

  async getDownloadFileList() {
    const dir = await fs.opendir(downloadFolderPath)
    const fileList = []

    for await (const file of dir) {
      fileList.push(file.name)
    }
    
    return fileList
  }

}