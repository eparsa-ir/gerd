/**
 * Poles ERP - Cloudflare Worker Telegram Reverse Proxy
 * بهینه‌سازی شده برای اتصال پرسرعت سرورهای ایران (لیارا) به تلگرام
 * با پشتیبانی از استریمینگ، فایل‌های سنگین، وب‌هوک و هدرهای استاندارد
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // پاسخ تست سلامت برای بررسی وضعیت آنلاین بودن ورکر
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'online',
        service: 'Poles ERP Telegram Proxy Worker',
        node: 'Cloudflare Edge Anycast',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // هدایت مسیر و کوئری‌ها به آدرس رسمی سرورهای تلگرام
    const targetUrl = new URL(`https://api.telegram.org${url.pathname}${url.search}`);

    // تنظیم هدرهای استاندارد و حذف هدرهای امنیتی مانع‌ساز کلودفلر
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'api.telegram.org');
    newHeaders.delete('cf-connecting-ip');
    newHeaders.delete('cf-ipcountry');
    newHeaders.delete('cf-ray');
    newHeaders.delete('cf-visitor');

    const newRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'follow'
    });

    try {
      const response = await fetch(newRequest);
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', '*');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } catch (err) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Proxy forwarding failed',
        details: err?.message || String(err)
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  }
};
