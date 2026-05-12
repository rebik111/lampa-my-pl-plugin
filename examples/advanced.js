/**
 * My PL Plugin - Advanced Usage Examples
 * Version: 1.0.0
 * 
 * Включає 12+ прикладів використання плагіну
 */

// ========================================
// 1. БАЗОВА ІНІЦІАЛІЗАЦІЯ
// ========================================

console.log('My PL Plugin initialized');

// Отримання посилання на плагін
const plugin = window.MyPLPlugin;

// ========================================
// 2. ПОШУК КОНТЕНТУ
// ========================================

// Простий пошук
plugin.search('The Matrix').then(results => {
    console.log('Знайдено результатів:', results.length);
    results.forEach(item => {
        console.log(`- ${item.title} (${item.source})`);
    });
});

// Пошук з обробкою помилок
plugin.search('Breaking Bad')
    .then(results => {
        if (results.length === 0) {
            console.warn('Результатів не знайдено');
            return;
        }
        console.log(`Знайдено ${results.length} результатів`);
        return results;
    })
    .catch(error => {
        console.error('Помилка пошуку:', error);
    });

// ========================================
// 3. ОТРИМАННЯ ДЕТАЛЕЙ ТА ЯКОСТЕЙ
// ========================================

async function getVideoDetails(searchQuery) {
    const results = await plugin.search(searchQuery);

    if (results.length === 0) {
        console.log('Видео не знайдено');
        return null;
    }

    const firstResult = results[0];
    const details = await plugin.getDetails(firstResult.id, firstResult.data);

    console.log('=== ДЕТАЛІ ВИДЕО ===');
    console.log('Назва:', details.title);
    console.log('Доступні якості:');

    Object.entries(details.qualities).forEach(([quality, url]) => {
        console.log(`  ✓ ${quality}: ${url}`);
    });

    return details;
}

// Використання
// getVideoDetails('The Matrix');

// ========================================
// 4. ВИБІР ЯКОСТІ ТА ВІДТВОРЕННЯ
// ========================================

// Відтворити в автоматичній якості
function playAuto(searchQuery) {
    plugin.search(searchQuery).then(results => {
        if (results.length > 0) {
            const firstResult = results[0];
            plugin.getDetails(firstResult.id, firstResult.data).then(details => {
                const qualities = Object.entries(details.qualities);
                if (qualities.length > 0) {
                    const [quality, url] = qualities[0];
                    plugin.playWithQuality(url, quality);
                    console.log(`Відтворення: ${details.title} (${quality})`);
                }
            });
        }
    });
}

// Відтворити з вибором найвищої якості
function playBestQuality(searchQuery) {
    plugin.search(searchQuery).then(results => {
        if (results.length > 0) {
            const firstResult = results[0];
            plugin.getDetails(firstResult.id, firstResult.data).then(details => {
                const qualities = Object.entries(details.qualities);
                const qualityOrder = ['4K (2160p)', 'Full HD (1080p)', 'HD (720p)', 'SD (480p)', 'Auto'];

                let selectedQuality = null;
                for (let quality of qualityOrder) {
                    if (qualities.some(q => q[0] === quality)) {
                        selectedQuality = qualities.find(q => q[0] === quality);
                        break;
                    }
                }

                if (selectedQuality) {
                    plugin.playWithQuality(selectedQuality[1], selectedQuality[0]);
                    console.log(`Відтворення в найвищій якості: ${selectedQuality[0]}`);
                }
            });
        }
    });
}

// Використання
// playBestQuality('The Matrix');

// ========================================
// 5. РОБОТА З КЕШЕМ
// ========================================

// Отримання кешованих запитів
function viewCache() {
    const stats = plugin.getCacheStats();
    console.log('Кешовані запити:', stats.itemsCount);
    console.log('Деталі:', stats.items);
}

// Очищення кешу
function clearAllCache() {
    plugin.clearCache();
    console.log('Кеш очищено');
}

// ========================================
// 6. НАЛАШТУВАННЯ МОВИ
// ========================================

// Переключення на російську
function switchToRussian() {
    plugin.setLang('ru');
    console.log('Мова:', plugin.getLang('name')); // My PL
    console.log('Пошук:', plugin.getLang('search')); // Поиск
}

// Переключення на англійську
function switchToEnglish() {
    plugin.setLang('en');
    console.log('Search button text:', plugin.getLang('search')); // Search
}

// Переключення на українську
function switchToUkrainian() {
    plugin.setLang('uk');
    console.log('Пошук:', plugin.getLang('search')); // Пошук
}

// ========================================
// 7. РОЗШИРЕНИЙ ПОШУК (ФІЛЬТРУВАННЯ)
// ========================================

async function advancedSearch(query, source = null) {
    const results = await plugin.search(query);

    // Фільтрування за джерелом
    if (source) {
        return results.filter(item => item.source.toLowerCase().includes(source.toLowerCase()));
    }

    return results;
}

// Пошук тільки на UAFix
async function searchUAFix(query) {
    const results = await advancedSearch(query, 'UAFix');
    console.log('UAFix результати:', results);
    return results;
}

// Пошук тільки на FanFilm4K
async function searchFanFilm4K(query) {
    const results = await advancedSearch(query, 'FanFilm4K');
    console.log('FanFilm4K результати:', results);
    return results;
}

// Пошук тільки на ANWAP
async function searchANWAP(query) {
    const results = await advancedSearch(query, 'ANWAP');
    console.log('ANWAP результати:', results);
    return results;
}

// ========================================
// 8. ПАКЕТНА ОБРОБКА РЕЗУЛЬТАТІВ
// ========================================

async function processResults(searchQuery) {
    const results = await plugin.search(searchQuery);

    // Сортування за джерелом
    const bySource = {};
    results.forEach(item => {
        if (!bySource[item.source]) {
            bySource[item.source] = [];
        }
        bySource[item.source].push(item);
    });

    console.log('Результати за джерелами:');
    Object.entries(bySource).forEach(([source, items]) => {
        console.log(`\n${source}: ${items.length} результатів`);
        items.forEach(item => {
            console.log(`  - ${item.title}`);
        });
    });

    return bySource;
}

// ========================================
// 9. ОБРОБКА ПОМИЛОК ТА ПОВТОРНІ СПРОБИ
// ========================================

async function searchWithRetry(query, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`Спроба ${i + 1}/${maxRetries}...`);
            const results = await plugin.search(query);
            console.log(`✓ Успіх! Знайдено ${results.length} результатів`);
            return results;
        } catch (error) {
            console.warn(`✗ Помилка спроби ${i + 1}: ${error.message}`);

            if (i < maxRetries - 1) {
                // Очікування перед наступною спробою (експоненціальна затримка)
                const delay = Math.pow(2, i) * 1000;
                console.log(`Повтор через ${delay / 1000} сек...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error('❌ Не вдалось виконати пошук після всіх спроб');
    return [];
}

// ========================================
// 10. СТАТИСТИКА І АНАЛІТИКА
// ========================================

function getPluginStats() {
    return {
        cacheSize: plugin.getCacheStats().itemsCount,
        cacheItems: plugin.getCacheStats().items,
        supportedLanguages: plugin.getAvailableLangs(),
        availableSources: plugin.getAvailableSources(),
        pluginVersion: plugin.version,
        currentLanguage: plugin.lang
    };
}

function printStats() {
    const stats = getPluginStats();
    console.table({
        'Версія': stats.pluginVersion,
        'Поточна мова': stats.currentLanguage,
        'Кешовано запитів': stats.cacheSize,
        'Доступних мов': stats.supportedLanguages.length,
        'Доступних джерел': stats.availableSources.length
    });
}

// ========================================
// 11. ІНТЕГРАЦІЯ З LAMPA API
// ========================================

function integrateLampa() {
    if (window.Lampa && window.Lampa.api) {
        // Додати плагін до меню
        window.Lampa.api.addMenu({
            title: plugin.getLang('name'),
            icon: '📺',
            action: () => {
                console.log('My PL меню натиснуто');
                performSearch();
            }
        });

        // Реєстрація обробника для подій
        window.Lampa.api.on('play', (data) => {
            console.log('Відтворення активовано:', data);
        });
    }
}

// ========================================
// 12. НАЛАГОДЖЕННЯ ТА ТЕСТУВАННЯ
// ========================================

function debugInfo() {
    console.group('🔧 My PL Debug Info');
    console.log('Plugin Object:', plugin);
    console.log('Available Languages:', plugin.getAvailableLangs());
    console.log('Available Sources:', plugin.getAvailableSources());
    console.log('Cache Stats:', plugin.getCacheStats());
    console.log('Current Language:', plugin.lang);
    console.log('Plugin Version:', plugin.version);
    console.groupEnd();
}

// ========================================
// ЕКСПОРТУВАННЯ ФУНКЦІЙ ДЛЯ КОНСОЛІ
// ========================================

window.MyPLAdvanced = {
    // Базові операції
    search: plugin.search.bind(plugin),
    getDetails: plugin.getDetails.bind(plugin),
    play: plugin.playWithQuality.bind(plugin),

    // Приклади
    getVideoDetails,
    playAuto,
    playBestQuality,
    viewCache,
    clearCache: clearAllCache,
    switchToRussian,
    switchToEnglish,
    switchToUkrainian,
    advancedSearch,
    searchUAFix,
    searchFanFilm4K,
    searchANWAP,
    processResults,
    searchWithRetry,
    getPluginStats,
    printStats,
    integrateLampa,
    debugInfo
};

// Інформаційне повідомлення
console.log('%c💡 My PL Advanced Functions Available', 'color: #667eea; font-size: 14px; font-weight: bold;');
console.log('%cAccess via: window.MyPLAdvanced', 'color: #667eea; font-size: 12px;');
console.log('%cExample: window.MyPLAdvanced.playBestQuality("The Matrix")', 'color: #667eea; font-size: 12px;');

// Auto-run debug info
debugInfo();
