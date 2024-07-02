import fs from 'fs'
import path from 'path'

export function calculateDirectorySize(directoryPath: string) {
  let size = 0
  for (const file of fs.readdirSync(directoryPath)) {
    const filePath = path.join(directoryPath, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      size += calculateDirectorySize(filePath)
    } else {
      size += stat.size
    }
  }
  return size
}
