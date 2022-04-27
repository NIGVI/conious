

const { Conious } = require('../../../conious')
const path = require('path')
const fsCB = require('fs')
const fs = require('fs/promises')

const downloadFolder = path.join(__dirname, '..', 'downloads')
const temporalFolder = path.join(__dirname, '..', 'temp')


module.exports = async (server) => {
	
	const options = {
		// defaultHandlers: {
		// 	errorHandler({ err }) {
		// 		setTimeout(() => {
		// 			console.error(err)
		// 		}, 5500);
		// 	}
		// },
	}
	const app = new Conious(server, options)


	// mode parse and files in RAM
	app.set('/parse/file', {
		files: true,
		handler: async ({ files }) => {
			await saveFiles(files)
			return 'ok'
		}
	})

	app.set('/parse/params', {
		body: {
			mode: 'parse',
			type: 'form',
		},
		handler: async ({ body }) => {
			let res = sortingParams(body)
			return res
		}
	})

	app.set('/parse/all', {
		body: {
			mode: 'parse',
			type: 'form',
		},
		files: true,
		handler: async ({ body, files }) => {
			let res = sortingParams(body)
			await saveFiles(files)
			return res
		}
	})


	// stream from busboy (in RAM)
	app.set('/stream/file', {
		files: 'stream',
		handler: async ({ files }) => {
			await saveFiles(files, true)
			return 'ok'
		}
	})


	// only temporal folder (not in RAM)
	app.set('/temp/file', {
		files: {
			temp: temporalFolder
		},
		handler: async ({ files }) => {
			files.foreach(file => {
				if (file.stream) {
					throw new Error('In file has stream')
				}
				file.stream = fsCB.createWriteStream(file.tempPath)
			})
			await saveFiles(files, true)
			return 'ok'
		}
	})


	// temporal folder with stream from it folder (not in RAM)
	app.set('/temp-stream/file', {
		files: {
			mode: 'stream',
			temp: temporalFolder
		},
		handler: async ({ files }) => {
			await saveFiles(files, true)
			return 'ok'
		}
	})

}

function sortingParams(paramsObject) {
	return Object.entries(paramsObject).sort((el1, el2) => {
		if (el1[0] < el2[0]) return -1
		if (el1[0] === el2[0]) return 0
		if (el1[0] > el2[0]) return 1
	})
}

async function saveFiles(files, isStream = false) {
	const asyncSavingPromise = []
	for (const file of files) {
		const saveFilePromise = (async () => {
			if (/^\w+$/.test(file.filename)) {
				const filePath = path.join(downloadFolder, file.filename)

				if (!isStream) {
					await fs.writeFile(filePath, file.data)
				}
				if (isStream) {
					const readStream = fsCB.createReadStream(filePath)
					await file.stream.pipe(readStream)
				}
			}
		})()
		asyncSavingPromise.push(saveFilePromise)
	}
	await new Promise.all(asyncSavingPromise)
}