import * as cheerio from 'cheerio'

type ScraperSearchResult = {
  title: string
  content: string
  url: {
    href: string
    name: string
  }
}

export function scrapeSearchResults(html: string, limit = 5) {
  const $ = cheerio.load(html, {
    xmlMode: false,
  })

  const resultElements = $('#links > .result')
  const scrapedData: Array<ScraperSearchResult> = []

  for (let i = 0; i < limit && i < resultElements.length; i++) {
    const title = $(resultElements[i]).find('.result__title').text()
    const content = $(resultElements[i]).find('.result__snippet').text()
    const url = $(resultElements[i]).find('.result__url')
    const href = url.attr('href') ?? ''
    const name = url.text()

    scrapedData.push({
      title: trimScrapedText(title),
      content: trimScrapedText(content),
      url: {
        href: extractHrefFromDuckDuckGo(href) ?? href,
        name: trimScrapedText(name),
      },
    })
  }

  return scrapedData
}

function extractHrefFromDuckDuckGo(url: string) {
  try {
    const parsedUrl = new URL('http:' + url)
    return parsedUrl.searchParams.get('uddg')
  } catch {
    return null
  }
}

function trimScrapedText(text: string) {
  return text.replace(/^\s+/g, '').replace(/\s+$/g, '')
}
