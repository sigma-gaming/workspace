/// <reference lib="webworker" />

const fallbackHtml = `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="theme-color" content="#1E0130">
  <title>Сайт недоступен</title>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&amp;display=swap" rel="stylesheet">
</head>
<body>
  <style>
    * {
      box-sizing: border-box;
    }
    body { 
      background-color: #181623; 
      color: #C0C1D9; 
      font-family: Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100%;
      padding: 20px;
    }
    .container {
      max-width: 320px;
      text-align: center;
    }
    h1 { 
      font-size: 24px; 
      line-height: 32px;
      font-weight: 500;
      margin: 16px 0 32px 0;
    }
    p {
      font-size: 16px;
      margin: 0;
      line-height: 1.5;
    }
    p + p {
      margin-top: 16px;
    }
    a {
      color: #ad6ddf;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
  <div class="container">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="orange" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 96px; height: 96px;"><path d="M4 7m0 1a1 1 0 0 1 1 -1h14a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-14a1 1 0 0 1 -1 -1z"></path><path d="M7 16v4"></path><path d="M7.5 16l9 -9"></path><path d="M13.5 16l6.5 -6.5"></path><path d="M4 13.5l6.5 -6.5"></path><path d="M17 16v4"></path><path d="M5 20h4"></path><path d="M15 20h4"></path><path d="M17 7v-2"></path><path d="M7 7v-2"></path></svg>
    <h1>Сайт недоступен</h1>
    <p>У вас отсутствует подключение к&nbsp;интернету, или сайт заблокирован в&nbsp;вашем&nbsp;регионе</p>
    <p>Получите актуальный домен в&nbsp;нашем Telegram&nbsp;боте: <a href="https://t.me/SigmaGamesBot">@SigmaGamesBot</a></p>
  </div>
</body>`

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
      console.info('Fetching navigation response')
      const response = await fetchWithTimeout(event.request, 5000)

      if (!response?.ok) {
        throw new Error('Invalid response')
      }

      const xHeader = response.headers.get('x-sigma-games')

      if (xHeader !== '1') {
        throw new Error('Missing or incorrect x-sigma-games header')
      }

      console.info('Navigation response is ok, returning original response')
      return response
    } catch (error) {
      console.error('Failed to fetch navigation response:', error)

      try {
        console.info('Fetching actual domain')
        const domainResponse = await fetch(`${domainUrl}/getActualDomain`)

        if (domainResponse.ok) {
          console.info('Domain response is ok, parsing data')

          const data = await domainResponse.json()
          const currentHost = new URL(event.request.url).host
          console.info('Current host:', currentHost)
          console.info('Actual host:', data.host)

          if (data?.host && data.host !== currentHost) {
            console.info('Redirecting to new domain')

            const redirectUrl = `https://${data.host}`
            return Response.redirect(redirectUrl, 302)
          }

          console.info('Response does not contain host or host is the same')
        }
      } catch (error) {
        console.error('Failed to fetch the actual domain:', error)
      }

      console.info('Returning the fallback response')

      return new Response(fallbackHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      })
    }
  }
}

main()
