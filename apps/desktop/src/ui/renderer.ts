function generatePatternBackground() {
  const div = document.getElementById('pattern-bg')
  if (!div) {
    console.warn('Pattern background not found in DOM')
    return
  }

  div.innerText = Array.from({ length: 100 })
    .map((_) => 'I')
    .join('')
}

generatePatternBackground()
