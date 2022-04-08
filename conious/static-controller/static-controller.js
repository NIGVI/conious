

const fs = require('fs')
const path = require('path')


class StaticController {

	#directories = new Map()
	constructor() {}


	deleteWatchers() {
		for (const dir of this.#directories.values()) {
			for (const watcher of dir.watchers) {
				watcher.close()
			}
		}
	}
	
	
	async setStaticPath(filesPathStorage, path, dirPath, cacheSetting, unique = Symbol()) {
		const [filePaths, dirPaths, addresses] =  await this.#getStaticPath(dirPath)
	
		if (!this.#directories.has(unique)) {
			this.#directories.set(unique, {
				filesPathStorage,
				path,
				dirPath,
				cacheSetting,

				paths: {},
				watchers: [],
			})
		}
		const filePathsFromMap = this.#directories.get(unique).paths
	
		const timeout = null
		const outdatedFiles = Object.assign({}, filePathsFromMap)
	
		for (let i = 0; i < filePaths.length; i++) {
			const indexDot = filePaths[i].lastIndexOf('.')
			let fileType = ~indexDot ? filePaths[i].slice(indexDot + 1) : 'none'
			if (~fileType.indexOf('/')) fileType = 'none'
			const endpointPath = path + addresses[i] + '/'
	
			if (outdatedFiles[endpointPath]) {
				delete outdatedFiles[endpointPath]
			}
	
	
			filesPathStorage[endpointPath] = {
				cache: cacheSetting,
				output: fileType,
				getStream: () => fs.createReadStream(filePaths[i])
			}
		}
	
		for (const outdatedFile of Object.keys(outdatedFiles)) {
			filePathsFromMap[outdatedFile].watcher.close()
	
			delete filesPathStorage[outdatedFile]
			delete filePathsFromMap[outdatedFile]
		}
	
		const watchers = this.#directories.get(unique).watchers 
		for (let i = 0; i < dirPaths.length; i++) {
			const watcherInstance = fs.watch(dirPaths[i], this.#watcher.bind(this, timeout, unique))
			watchers.push(watcherInstance)
		}
	}
	
	
	#watcher(timeout, unique) {
		clearTimeout(timeout)
		timeout = setTimeout(() => {
			const dir = this.#directories.get(unique)
			this.setStaticPath(dir.filesPathStorage, dir.path, dir.dirPath, dir.cacheSetting)
		}, 1000)
	}


	async #getStaticPath(dirPath, address = '') {
		const dir = await fs.promises.opendir(dirPath)
		const filePaths = []
		const dirPaths = [dirPath]
		const addresses = []
	
		for await (const file of dir) {
			const filePath = path.join(dirPath, file.name)
			const addressPath = path.posix.join(address, file.name)
			const fileInner = await fs.promises.stat(filePath)
	
			if (fileInner.isFile()) {
				filePaths.push(filePath)
				addresses.push(addressPath)
				continue
			}
			const [ filePathsOfDir, dirPathsOfDir, addressesOfDir ] = await this.#getStaticPath(filePath, addressPath)
			dirPaths.push(...dirPathsOfDir)
			filePaths.push(...filePathsOfDir)
			addresses.push(...addressesOfDir)
		}
	
		return [filePaths, dirPaths, addresses]
	}

}

module.exports = {
	StaticController
}