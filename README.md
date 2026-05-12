# My PL - Lampa Streaming Plugin 📺

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Lampa](https://img.shields.io/badge/Lampa-Media%20Station%20X-green)

Мультиджерельний плагін потокового мовлення для **Lampa Media Station X** з автоматичним виявленням якостей, багатомовною підтримкою та незалежною кнопкою меню.

## 🌟 Особливості

✅ **Мультиджерельність**
- UAFix
- FanFilm4K  
- ANWAP

✅ **Якості відео**
- Автоматичне виявлення всіх доступних якостей
- 4K (2160p)
- Full HD (1080p)
- HD (720p)
- SD (480p)
- Вибір перед відтворенням

✅ **Мови**
- 🇺🇦 Українська
- 🇷🇺 Російська
- 🇬🇧 Англійська

✅ **Продуктивність**
- Smart caching (1 година)
- Паралельний пошук по всім джерелам
- CORS bypass
- Таймаути на запитах

✅ **Інтеграція**
- Окрема кнопка "My PL" в меню
- Не конфліктує з іншими плагінами
- Повна Lampa API сумісність

## 🚀 Встановлення

### Варіант 1: Через Lampa

1. Відкрийте **Lampa Media Station X**
2. Перейдіть до **Налаштувань** → **Плагіни**
3. Натисніть **Додати плагін**
4. Вставте URL:
   ```
   https://raw.githubusercontent.com/rebik111/lampa-my-pl-plugin/main/my-pl.js
   ```
5. Натисніть **Встановити**

### Варіант 2: Вручну

1. Клонуйте репозиторій:
   ```bash
   git clone https://github.com/rebik111/lampa-my-pl-plugin.git
   ```

2. Скопіюйте `my-pl.js` в папку плагінів Lampa

3. Перезавантажте Lampa

## 📖 Використання

### Базовий пошук

```javascript
// Пошук фільму
window.MyPLPlugin.search('The Matrix').then(results => {
    console.log('Знайдено:', results.length);
    results.forEach(item => {
        console.log(`- ${item.title} (${item.source})`);
    });
});
```

### Отримання деталей та якостей

```javascript
const results = await window.MyPLPlugin.search('Breaking Bad');
const details = await window.MyPLPlugin.getDetails(
    results[0].id, 
    results[0].data
);

console.log('Доступні якості:');
Object.entries(details.qualities).forEach(([quality, url]) => {
    console.log(`${quality}: ${url}`);
});
```

### Відтворення з вибором якості

```javascript
// Вибрати якість і відтворити
window.MyPLPlugin.playWithQuality(
    'https://example.com/video.m3u8',
    'Full HD (1080p)'
);
```

### Зміна мови

```javascript
// Переключення на російську
window.MyPLPlugin.setLang('ru');

// Переключення на англійську
window.MyPLPlugin.setLang('en');

// Повернення на українську
window.MyPLPlugin.setLang('uk');
```

## 🔧 API

### Методи

#### `search(query)`
Пошук контенту по всім джерелам

**Параметри:**
- `query` (string) - пошуковий запит

**Повертає:** Promise<Array<Object>>

```javascript
await MyPLPlugin.search('The Matrix');
```

---

#### `getDetails(itemId, itemData)`
Отримання деталей про фільм/серіал та доступних якостей

**Параметри:**
- `itemId` (string) - унікальний ID елемента
- `itemData` (object) - дані про елемент

**Повертає:** Promise<Object>

```javascript
const details = await MyPLPlugin.getDetails('uafix_0', movieData);
```

---

#### `playWithQuality(url, quality)`
Відтворення видео з вибраною якістю

**Параметри:**
- `url` (string) - посилання на видео
- `quality` (string) - якість (4K, 1080p, 720p, 480p)

```javascript
MyPLPlugin.playWithQuality('https://example.com/video.m3u8', 'Full HD (1080p)');
```

---

#### `setLang(lang)`
Зміна мови інтерфейсу

**Параметри:**
- `lang` (string) - код мови (uk, ru, en)

```javascript
MyPLPlugin.setLang('ru');
```

---

#### `getLang(key)`
Отримання тексту на поточній мові

**Параметри:**
- `key` (string) - ключ локалізації

**Повертає:** string

```javascript
MyPLPlugin.getLang('search'); // "Пошук" (УК) або "Поиск" (РУ)
```

---

#### `clearCache()`
Очищення кешу

```javascript
MyPLPlugin.clearCache();
```

---

#### `getCacheStats()`
Отримання статистики кешу

**Повертає:** Object

```javascript
const stats = MyPLPlugin.getCacheStats();
console.log(`Кешовано: ${stats.itemsCount} елементів`);
```

---

#### `getAvailableLangs()`
Отримання списку доступних мов

**Повертає:** Array<string>

```javascript
console.log(MyPLPlugin.getAvailableLangs()); // ['uk', 'ru', 'en']
```

---

#### `getAvailableSources()`
Отримання списку доступних джерел

**Повертає:** Array<Object>

```javascript
MyPLPlugin.getAvailableSources();
// [
//   { id: 'uafix', name: 'UAFix' },
//   { id: 'fanfilm4k', name: 'FanFilm4K' },
//   { id: 'anwap', name: 'ANWAP' }
// ]
```

## 📋 Структура результатів

### Результат пошуку

```javascript
{
    id: "uafix_0",
    source: "UAFix",
    sourceId: "uafix",
    title: "The Matrix",
    description: "A computer hacker...",
    poster: "https://...",
    year: "1999",
    data: { /* оригінальні дані */ }
}
```

### Деталі елемента

```javascript
{
    id: "uafix_0",
    title: "The Matrix",
    description: "A computer hacker...",
    poster: "https://...",
    year: "1999",
    url: "https://...",
    qualities: {
        "4k": "https://...",
        "1080p": "https://...",
        "720p": "https://...",
        "480p": "https://..."
    }
}
```

## 🧪 Тестування

Отворіть браузер консоль (F12) і запустіть:

```javascript
// Простий тест
window.MyPLPlugin.search('test').then(r => console.log(r));

// Повна статистика
console.log(window.MyPLPlugin);

// Перевірка кешу
console.log(window.MyPLPlugin.getCacheStats());
```

## 📁 Файлова структура

```
lampa-my-pl-plugin/
├── my-pl.js                    # Основний плагін
├── package.json               # Метаніформація
├── README.md                  # Документація
├── LICENSE                    # MIT ліцензія
└── examples/
    ├── test.html              # Тестовий інтерфейс
    └── advanced.js            # Просунуті приклади
```

## 🎨 Приклади

### Приклад 1: Пошук і вибір якості

```javascript
async function searchAndPlay(query) {
    const results = await window.MyPLPlugin.search(query);
    
    if (results.length === 0) {
        alert('Результатів не знайдено');
        return;
    }
    
    const first = results[0];
    const details = await window.MyPLPlugin.getDetails(first.id, first.data);
    
    // Обрати найвищу якість
    const qualities = Object.entries(details.qualities);
    if (qualities.length > 0) {
        const [quality, url] = qualities[0];
        window.MyPLPlugin.playWithQuality(url, quality);
    }
}

searchAndPlay('Breaking Bad');
```

### Приклад 2: Пошук на конкретному джерелі

```javascript
async function searchUAFix(query) {
    const results = await window.MyPLPlugin.search(query);
    const uafixResults = results.filter(r => r.sourceId === 'uafix');
    
    console.log(`UAFix: ${uafixResults.length} результатів`);
    return uafixResults;
}

searchUAFix('The Matrix');
```

### Приклад 3: Багатомовна обробка

```javascript
function setupMultiLanguage() {
    const langs = window.MyPLPlugin.getAvailableLangs();
    
    langs.forEach(lang => {
        window.MyPLPlugin.setLang(lang);
        const text = window.MyPLPlugin.getLang('search');
        console.log(`${lang}: ${text}`);
    });
}

setupMultiLanguage();
// uk: Пошук
// ru: Поиск
// en: Search
```

## 🐛 Вирішення проблем

### Проблема: Плагін не завантажується

**Рішення:**
- Перевірте консоль (F12) на помилки
- Переконайтеся, що Lampa повністю завантажена
- Очистіть кеш браузера

### Проблема: Результати не знайдені

**Рішення:**
- Перевірте доступність джерел (відкрийте https://uafix.net тощо)
- Використайте точнішу назву фільму
- Перевірте інтернет з'єднання

### Проблема: Виходить помилка CORS

**Рішення:**
- Це нормально - плагін автоматично використовує bypass
- Перезавантажте Lampa
- Очистіть кеш

## 📞 Контакти

- **GitHub:** [rebik111](https://github.com/rebik111)
- **Репозиторій:** [lampa-my-pl-plugin](https://github.com/rebik111/lampa-my-pl-plugin)
- **Issues:** [Повідомити про помилку](https://github.com/rebik111/lampa-my-pl-plugin/issues)

## 📄 Ліцензія

МІТ Ліцензія - дивіться [LICENSE](LICENSE) для деталей

## 🙏 Подяки

- Lampa Media Station X - чудова платформа
- Спільноті розробників Lampa
- Всім користувачам, які тестують і роблять фідбек

## 📈 Версія історія

### v1.0.0 (2026-05-12)
- ✅ Перший реліз
- ✅ Поддержка 3 джерел
- ✅ Багатомовність
- ✅ Автоматичне виявлення якостей
- ✅ Smart caching
- ✅ CORS bypass

---

**Приємного перегляду! 🎬🍿**
