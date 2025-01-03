/// <reference lib="webworker" />

function main() {
  const { clients, addEventListener, skipWaiting } =
    self as unknown as ServiceWorkerGlobalScope

  function fetchWithTimeout(
    request: Request,
    timeout = 5000,
  ): Promise<Response> {
    return Promise.race([
      fetch(request),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout),
      ),
    ])
  }

  addEventListener('install', (event) => {
    event.waitUntil(skipWaiting())
  })

  addEventListener('activate', (event) => {
    event.waitUntil(clients.claim())
  })

  addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(handleNavigation(event))
    }
  })

  const domainUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://sigm.to/domain'
      : 'https://redirect.sigma.local:5080/domain'

  async function handleNavigation(event: FetchEvent) {
    try {
      const response = await fetchWithTimeout(event.request, 5000)

      if (!response?.ok) {
        throw new Error('Invalid response')
      }

      const xHeader = response.headers.get('x-sigma-games')

      if (xHeader !== '1') {
        throw new Error('Missing or incorrect x-sigma-games header')
      }

      return response
    } catch (error) {
      try {
        const domainResponse = await fetch(`${domainUrl}/getActualDomain`)

        if (domainResponse.ok) {
          const data = await domainResponse.json()
          const currentHost = new URL(event.request.url).host

          if (data?.host && data.host !== currentHost) {
            const redirectUrl = `https://${data.host}`
            return Response.redirect(redirectUrl, 302)
          }
        }
      } catch (error) {
        console.error('Failed to fetch the actual domain:', error)
      }

      return new Response(
        `<div>
          <style>h1 { font-family: Helvetica, sans-serif; font-size: 24px; }</style>
          <h1>Сайт недоступен, и не удалось получить адрес для перенаправления. Найдите актуальный домен в нашем Telegram-канале: <a href="https://t.me/SigmaGamesFeed">@SigmaGamesFeed</a>.</h1>
        </div>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=UTF-8' },
        },
      )
    }
  }
}

main()
