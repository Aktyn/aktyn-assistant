import path from 'path-browserify'

export type FixedFile = File & { path: string }
export type FilesTree = {
  path: string
  files: FixedFile[]
  directories: Record<string, FilesTree>
}

export function isFixedFile(file: unknown): file is FixedFile {
  return file instanceof File && 'path' in file
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
    entry.file(async (file) => {
      reading--
      if (isFixedFile(file)) {
        contents.push(file)
      }

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

  let shortestDirectory = path.dirname(files[0].path)
  for (let i = 1; i < files.length; i++) {
    const dir = path.dirname(files[i].path)
    if (dir.length < shortestDirectory.length) {
      shortestDirectory = dir
    }
  }

  return shortestDirectory
}

export function buildFilesTree(
  files: FixedFile[],
  root = getCommonRoot(files),
) {
  const rootTree: FilesTree = {
    path: root,
    files: [],
    directories: {},
  }

  for (const file of files) {
    const relativePath = path.relative(root, file.path)
    const directoriesArray = path.dirname(relativePath).split(path.sep)

    let tree = rootTree
    for (const dir of directoriesArray) {
      if (dir === '.' || dir === '..') {
        continue
      }

      if (!tree.directories[dir]) {
        tree.directories[dir] = {
          path: path.join(tree.path, dir),
          files: [],
          directories: {},
        }
      }
      tree = tree.directories[dir]
    }
    tree.files.push(file)
  }

  return rootTree
}
