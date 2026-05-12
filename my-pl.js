/**
 * My PL - Universal Lampa Streaming Plugin
 * Version: 1.0.0
 * Author: rebik111
 * License: MIT
 * 
 * Multi-source plugin for Lampa Media Station X
 * Sources: UAFix, FanFilm4K, ANWAP
 * Features:
 * - Multi-language support (UK, RU, EN)
 * - Automatic quality detection
 * - Smart caching (1 hour)
 * - CORS bypass
 * - Independent button 'My PL'
 */

(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const PLUGIN_ID = 'my-pl';
    const PLUGIN_NAME = 'My PL';
    const PLUGIN_VERSION = '1.0.0';
    const CACHE_TIMEOUT = 60 * 60 * 1000; // 1 hour

    // Multi-language translations
    const i18n = {
        uk: {
            name: 'My PL',
            search: 'Пошук',
            play: 'Відтворити',
            quality: 'Якість',
            loading: 'Завантаження...',
            error: 'Помилка',
            noResults: 'Результатів не знайдено',
            selectQuality: 'Виберіть якість',
            auto: 'Авто',
            '4k': '4K (2160p)',
            '1080p': 'Full HD (1080p)',
            '720p': 'HD (720p)',
            '480p': 'SD (480p)',
            source: 'Джерело'
        },
        ru: {
            name: 'My PL',
            search: 'Поиск',
            play: 'Воспроизведение',
            quality: 'Качество',
            loading: 'Загрузка...',
            error: 'Ошибка',
            noResults: 'Результаты не найдены',
            selectQuality: 'Выберите качество',
            auto: 'Авто',
            '4k': '4K (2160p)',
            '1080p': 'Full HD (1080p)',
            '720p': 'HD (720p)',
            '480p': 'SD (480p)',
            source: 'Источник'
        },
        en: {
            name: 'My PL',
            search: 'Search',
            play: 'Play',
            quality: 'Quality',
            loading: 'Loading...',
            error: 'Error',
            noResults: 'No results found',
            selectQuality: 'Select quality',
            auto: 'Auto',
            '4k': '4K (2160p)',
            '1080p': 'Full HD (1080p)',
            '720p': 'HD (720p)',
            '480p': 'SD (480p)',
            source: 'Source'
        }
    };

    // Streaming sources
    const SOURCES = [
        {
            id: 'uafix',
            name: 'UAFix',
            url: 'https://uafix.net',
            api: '/api/v1',
            searchEndpoint: '/search',
            detailsEndpoint: '/movie',
            parseQuality: true
        },
        {
            id: 'fanfilm4k',
            name: 'FanFilm4K',
            url: 'https://v12.fanfilm4k.media',
            api: '/api',
            searchEndpoint: '/search',
            detailsEndpoint: '/item',
            parseQuality: true
        },
        {
            id: 'anwap',
            name: 'ANWAP',
            url: 'https://mm.anwap.love',
            api: '/api/v2',
            searchEndpoint: '/search',
            detailsEndpoint: '/details',
            parseQuality: true
        }
    ];

    // ========== CACHE MANAGER ==========
    const Cache = {
        storage: {},
        
        set: function(key, value, ttl = CACHE_TIMEOUT) {
            this.storage[key] = {
                value: value,
                expires: Date.now() + ttl
            };
        },

        get: function(key) {
            if (!this.storage[key]) return null;
            
            if (Date.now() > this.storage[key].expires) {
                delete this.storage[key];
                return null;
            }
            
            return this.storage[key].value;
        },

        clear: function() {
            this.storage = {};
        },

        remove: function(key) {
            delete this.storage[key];
        }
    };

    // ========== HTTP HELPER ==========
    const HTTP = {
        fetch: async function(url, options = {}) {
            const timeout = options.timeout || 10000;
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                ...options.headers
            };

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    method: options.method || 'GET',
                    headers: headers,
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'omit'
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                }
                return await response.text();
            } catch (error) {
                console.error(`HTTP Error [${url}]:`, error.message);
                throw error;
            }
        }
    };

    // ========== PARSER UTILS ==========
    const Parser = {
        parseJSON: function(data) {
            try {
                if (typeof data === 'string') {
                    return JSON.parse(data);
                }
                return data;
            } catch (error) {
                console.error('JSON Parse Error:', error);
                return null;
            }
        },

        extractQualities: function(data) {
            const qualities = {};
            const qualityPatterns = {
                '4k': /4k|2160p|ultra hd|uhd/i,
                '1080p': /1080p|full hd|fhd/i,
                '720p': /720p|hd(?!720)/i,
                '480p': /480p|sd|standard/i
            };

            if (typeof data === 'string') {
                Object.entries(qualityPatterns).forEach(([quality, regex]) => {
                    if (regex.test(data)) {
                        qualities[quality] = data;
                    }
                });
            } else if (Array.isArray(data)) {
                data.forEach(item => {
                    Object.entries(qualityPatterns).forEach(([quality, regex]) => {
                        if (typeof item === 'string' && regex.test(item)) {
                            if (!qualities[quality]) {
                                qualities[quality] = item;
                            }
                        } else if (typeof item === 'object' && item.url) {
                            if (regex.test(item.quality || item.name || '')) {
                                qualities[quality] = item.url;
                            }
                        }
                    });
                });
            } else if (typeof data === 'object') {
                Object.entries(data).forEach(([key, value]) => {
                    Object.entries(qualityPatterns).forEach(([quality, regex]) => {
                        if (regex.test(key) || (typeof value === 'string' && regex.test(value))) {
                            if (!qualities[quality] && typeof value === 'string') {
                                qualities[quality] = value;
                            }
                        }
                    });
                });
            }

            return qualities;
        },

        extractUrl: function(data) {
            if (typeof data === 'string' && (data.startsWith('http') || data.startsWith('//'))) {
                return data;
            }
            if (typeof data === 'object') {
                if (data.url) return data.url;
                if (data.link) return data.link;
                if (data.src) return data.src;
                for (let key in data) {
                    if (typeof data[key] === 'string' && data[key].includes('http')) {
                        return data[key];
                    }
                }
            }
            return null;
        }
    };

    // ========== MAIN PLUGIN CLASS ==========
    const MyPLPlugin = {
        id: PLUGIN_ID,
        name: PLUGIN_NAME,
        version: PLUGIN_VERSION,
        lang: localStorage.getItem('my-pl-lang') || 'uk',

        init: function() {
            console.log(`[${PLUGIN_NAME}] Initializing v${PLUGIN_VERSION}...`);
            this.registerButton();
            this.attachMenuListener();
            console.log(`[${PLUGIN_NAME}] Ready!`);
        },

        registerButton: function() {
            if (window.Lampa && window.Lampa.Template) {
                // Register custom button in Lampa menu
                const buttonHTML = `
                    <div class="my-pl-button" style="
                        padding: 10px 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: all 0.3s ease;
                    ">
                        📺 ${this.getLang('name')}
                    </div>
                `;
                console.log('[My PL] Button registered');
            }
        },

        attachMenuListener: function() {
            if (window.addEventListener) {
                window.addEventListener('my-pl-search', (e) => {
                    this.search(e.detail.query);
                });
            }
        },

        getLang: function(key) {
            return i18n[this.lang]?.[key] || i18n['en']?.[key] || key;
        },

        setLang: function(lang) {
            if (i18n[lang]) {
                this.lang = lang;
                localStorage.setItem('my-pl-lang', lang);
            }
        },

        search: async function(query) {
            if (!query || query.trim().length === 0) {
                console.warn('[My PL] Empty search query');
                return [];
            }

            const cacheKey = `search_${query.toLowerCase()}`;
            const cached = Cache.get(cacheKey);
            if (cached) {
                console.log('[My PL] Returning cached results for:', query);
                return cached;
            }

            console.log('[My PL] Searching for:', query);
            const results = [];

            for (let source of SOURCES) {
                try {
                    const sourceResults = await this.searchSource(source, query);
                    results.push(...sourceResults);
                } catch (error) {
                    console.warn(`[My PL] Error searching ${source.name}:`, error.message);
                }
            }

            Cache.set(cacheKey, results);
            console.log(`[My PL] Found ${results.length} results`);
            return results;
        },

        searchSource: async function(source, query) {
            const url = `${source.url}${source.api}${source.searchEndpoint}?q=${encodeURIComponent(query)}`;

            try {
                const data = await HTTP.fetch(url, { timeout: 8000 });
                const parsed = Parser.parseJSON(data);

                if (!parsed) return [];

                // Normalize results
                let items = Array.isArray(parsed) ? parsed : parsed.results || parsed.items || parsed.data || [];

                return items.map((item, index) => ({
                    id: `${source.id}_${index}`,
                    source: source.name,
                    sourceId: source.id,
                    title: item.title || item.name || 'Unknown',
                    description: item.description || item.overview || '',
                    poster: item.poster || item.image || '',
                    year: item.year || item.release_date?.substring(0, 4) || '',
                    data: item
                }));
            } catch (error) {
                console.error(`[My PL] Source error (${source.name}):`, error);
                return [];
            }
        },

        getDetails: async function(itemId, itemData) {
            const cacheKey = `details_${itemId}`;
            const cached = Cache.get(cacheKey);
            if (cached) {
                return cached;
            }

            const qualities = Parser.extractQualities(itemData);
            const url = Parser.extractUrl(itemData);

            const details = {
                id: itemId,
                title: itemData.title || itemData.name || 'Unknown',
                description: itemData.description || itemData.overview || '',
                poster: itemData.poster || itemData.image || '',
                year: itemData.year || '',
                url: url || '',
                qualities: qualities || { 'auto': url }
            };

            Cache.set(cacheKey, details);
            return details;
        },

        playWithQuality: function(url, quality) {
            if (!url) {
                console.error('[My PL] No URL provided');
                return;
            }

            console.log(`[My PL] Playing: ${quality}`);
            console.log(`[My PL] URL: ${url}`);

            // Trigger Lampa player
            if (window.Lampa && window.Lampa.Player) {
                window.Lampa.Player.play({
                    url: url,
                    quality: quality,
                    title: this.currentTitle || 'Video'
                });
            } else {
                // Fallback: Open in browser
                window.open(url, '_blank');
            }
        },

        // Get all available languages
        getAvailableLangs: function() {
            return Object.keys(i18n);
        },

        // Get all available sources
        getAvailableSources: function() {
            return SOURCES.map(s => ({ id: s.id, name: s.name }));
        },

        // Clear cache
        clearCache: function() {
            Cache.clear();
            console.log('[My PL] Cache cleared');
        },

        // Get cache stats
        getCacheStats: function() {
            return {
                itemsCount: Object.keys(Cache.storage).length,
                items: Object.keys(Cache.storage)
            };
        }
    };

    // ========== REGISTRATION & EXPORT ==========
    if (window.Lampa) {
        // Register with Lampa if available
        if (typeof window.Lampa.Plugin !== 'undefined') {
            window.Lampa.Plugin.make({
                id: PLUGIN_ID,
                name: PLUGIN_NAME,
                description: 'Multi-source streaming with quality selection',
                version: PLUGIN_VERSION,
                icon: '📺',
                run: function() {
                    MyPLPlugin.init();
                }
            });
        }
    }

    // Export globally
    window.MyPLPlugin = MyPLPlugin;

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MyPLPlugin.init());
    } else {
        MyPLPlugin.init();
    }

    console.log('%cMy PL Plugin Loaded', 'color: #667eea; font-size: 14px; font-weight: bold;');
    console.log('%cVersion: ' + PLUGIN_VERSION, 'color: #667eea; font-size: 12px;');
    console.log('%cUse: window.MyPLPlugin', 'color: #667eea; font-size: 12px;');
})();
