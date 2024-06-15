window.addEventListener('DOMContentLoaded', () => {
  const keys = ['chrome', 'node', 'electron']
  const versions = Object.entries(process.versions).filter(([key]) => keys.includes(key))
  document.body.setAttribute('versions', JSON.stringify(Object.fromEntries(versions)))
})
