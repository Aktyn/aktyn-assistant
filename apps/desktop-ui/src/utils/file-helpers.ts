import { cmp } from '@aktyn-assistant/common'
import path from 'path-browserify'

export type FixedFile = File & { path: string }
export type FilesTree = {
  path: string
  files: FixedFile[]
  directories: Record<string, FilesTree>
}

export async function getAllFileEntries(
  dataTransferItemList: DataTransferItemList,
) {
  const fileEntries: FileSystemEntry[] = []
  const queue: (FileSystemEntry | null)[] = []
  for (let i = 0; i < dataTransferItemList.length; i++) {
    queue.push(dataTransferItemList[i].webkitGetAsEntry())
  }
  while (queue.length > 0) {
    const entry = queue.shift()
    if (entry?.isFile) {
      fileEntries.push(entry)
    } else if (
      entry?.isDirectory &&
      'createReader' in entry &&
      typeof entry.createReader === 'function'
    ) {
      const reader: FileSystemDirectoryReader = entry.createReader()
      queue.push(...(await readAllDirectoryEntries(reader)))
    }
  }

  return Promise.all(
    fileEntries.map((entry) => readEntryContentAsync(entry)),
  ).then((files) => files.flat())
}

async function readAllDirectoryEntries(
  directoryReader: FileSystemDirectoryReader,
) {
  const entries: FileSystemEntry[] = []
  let readEntries = await readEntriesPromise(directoryReader)
  while (readEntries?.length ?? 0 > 0) {
    entries.push(...readEntries!)
    readEntries = await readEntriesPromise(directoryReader)
  }
  return entries
}

async function readEntriesPromise(directoryReader: FileSystemDirectoryReader) {
  try {
    return await new Promise<FileSystemEntry[]>((resolve, reject) => {
      directoryReader.readEntries(resolve, reject)
    })
  } catch (err) {
    console.error(err)
  }
}

async function readEntryContentAsync(entry: FileSystemEntry) {
  return new Promise<FixedFile[]>((resolve) => {
    let reading = 0
    const contents: FixedFile[] = []

    reading++
    //@ts-expect-error missing typings
    entry.file(async (file: FixedFile) => {
      reading--
      contents.push(file)

      if (reading === 0) {
        resolve(contents)
      }
    })
  })
}

function getCommonRoot(files: FixedFile[]) {
  if (!files.length) {
    return ''
  }

  const offset = files[0].path.lastIndexOf(files[0].name)
  let root = offset === -1 ? files[0].path : files[0].path.substring(0, offset)

  for (let i = 1; i < files.length; i++) {
    root = root.substring(0, cmp(root, files[i].path))
  }
  return root
}

function getRootDirectoryName(pathValue: string) {
  if (!pathValue.includes(path.sep)) {
    return pathValue
  }

  const firstSeparatorIndex = pathValue.indexOf(path.sep)
  return pathValue.substring(0, firstSeparatorIndex)
}

export function buildFilesTree(
  files: FixedFile[],
  root = getCommonRoot(files),
): FilesTree {
  const [filesInRoot, rest] = files.reduce(
    (acc, file) => {
      const relativePath = path.relative(root, file.path)
      if (relativePath.includes(path.sep)) {
        acc[1].push(file)
      } else {
        acc[0].push(file)
      }
      return acc
    },
    [[], []] as [FixedFile[], FixedFile[]],
  )

  const nestedLevelDirectories = new Set<string>()
  for (const file of rest) {
    const relativePath = path.relative(root, file.path)
    const rootDir = getRootDirectoryName(relativePath)
    if (rootDir) {
      nestedLevelDirectories.add(rootDir)
    }
  }

  const directories: Record<string, FilesTree> = {}
  for (const dir of nestedLevelDirectories) {
    if (dir === '.' || dir === '..') {
      continue
    }
    directories[dir] = buildFilesTree(rest, path.join(root, dir))
  }

  return {
    path: root,
    files: filesInRoot,
    directories,
  }
}
