import { fs, path } from '@tauri-apps/api'

export type ACGN = 'anime' | 'comic' | 'novel'

export interface Bangumi {
  id: number
  name: string
  relativePath: string
  tags: string[]
  watched: boolean
  type: ACGN
}

export interface Data {
  works: Bangumi[]
}

export default class FileManager {
  public folderPath!: string
  public settingsFilePath!: string
  public data!: Data
  public isInit = false

  async init(config: { folderPath?: string; settingsFilePath?: string }) {
    if (config.folderPath === undefined && config.settingsFilePath === undefined) {
      throw new Error('folderPath and settingsFilePath must be set at least one')
    }
    else if (config.folderPath !== undefined) {
      this.folderPath = config.folderPath
      this.settingsFilePath = await path.join(this.folderPath, 'bangumi.list.json')
    }
    else if (config.settingsFilePath !== undefined) {
      this.settingsFilePath = config.settingsFilePath
      this.folderPath = await path.dirname(this.settingsFilePath)
    }
    await this.getSettings()
    this.isInit = true
  }

  async getSettings() {
    let con = ''
    try {
      con = await fs.readTextFile(this.settingsFilePath)
    }
    catch {
      con = '{"works": []}'
    }
    this.data = JSON.parse(con)
  }

  async save() {
    fs.writeFile({ path: this.settingsFilePath, contents: JSON.stringify(this.data) })
  }

  async getDirs(relativePath?: string) {
    return fs.readDir(await path.join(this.folderPath, relativePath || ''))
  }
}
