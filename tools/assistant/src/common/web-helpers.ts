import * as cheerio from 'cheerio'

export async function getUrl(urlOrQuery: string) {
  if (
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/.test(
      urlOrQuery,
    )
  ) {
    return urlOrQuery
  }

  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(urlOrQuery)}`,
  )
  const html = await res.text()
  const $ = cheerio.load(html, {
    xmlMode: false,
  })
  const resultElements = $('#links > .result')
  if (resultElements.length) {
    const url = $(resultElements[0]).find('.result__url')
    const href = url.attr('href') ?? ''
    return extractHrefFromDuckDuckGo(href) ?? href
  }

  throw new Error('Site cannot be found')
}

function extractHrefFromDuckDuckGo(url: string) {
  try {
    const parsedUrl = new URL('http:' + url)
    return parsedUrl.searchParams.get('uddg')
  } catch {
    return null
  }
}
