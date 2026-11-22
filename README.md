<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/aa322b49-71bf-4374-b35c-a38bff4972df

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Yerel API ile çalıştırma

Node.js 24 veya üstü gereklidir. Masaüstündeki backend klasöründe npm start çalıştırın.
Ardından bu React proje klasöründe npm install ve npm run dev çalıştırıp tarayıcıda
http://127.0.0.1:3000 adresini açın.

API çağrıları Vite üzerinden http://127.0.0.1:3001 adresine iletilir.
Farklı bir adres için .env.local dosyasına BACKEND_URL ekleyin.
Backend'de API_TOKEN kullanıyorsanız aynı değeri .env.local içindeki BACKEND_API_TOKEN
alanına yazıp Vite'ı yeniden başlatın. Yayınlanan bir statik derlemede /api yolları
backend'e aynı origin üzerinden yönlendirilmelidir.

Yedekleme menüsü sunucudaki kayıtları dışa aktarır ve JSON yedeklerini içe alır.
Eski tarayıcı verileriniz varsa uygulamayı eski verilerin kayıtlı olduğu tarayıcı ve
adresle açın. Aynı menüden eski kayıtların yedeğini indirin ve içe aktarın.
Yedekteki koleksiyonlar aktarım sırasında sunucudaki karşılıklarının yerini alır.
