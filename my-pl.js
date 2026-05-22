/**
 * My PL - Universal Lampa Streaming Plugin
 * Version: 2.0.0
 * Author: rebik111
 * License: MIT
 * 
 * Multi-source plugin for Lampa Media Station X
 * Sources: UAFix, FanFilm4K, ANWAP
 * Features:
 * - Multi-language support (UK, RU, EN)
 * - Full component registration
 * - Search interface
 * - Quality selection
 * - Smart caching
 */

(function() {
    'use strict';

    // ========== CONFIGURATION ==========
    const PLUGIN_ID = 'my-pl';
    const PLUGIN_NAME = 'My PL';
    const PLUGIN_VERSION = '2.0.0';
    const CACHE_TIMEOUT = 60 * 60 * 1000; // 1 час

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
            source: 'Джерело',
            enterQuery: 'Введіть назву фільму',
            noQuality: 'Якість не найдена',
            playing: 'Відтворення...'
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
            source: 'Источник',
            enterQuery: 'Введите название фильма',
            noQuality: 'Качество не найдено',
            playing: 'Воспроизведение...'
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
            source: 'Source',
            enterQuery: 'Enter movie name',
            noQuality: 'Quality not found',
            playing: 'Playing...'
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
            detailsEndpoint: '/movie'
        },
        {
            id: 'fanfilm4k',
            name: 'FanFilm4K',
            url: 'https://v12.fanfilm4k.media',
            api: '/api',
            searchEndpoint: '/search',
            detailsEndpoint: '/item'
        },
        {
            id: 'anwap',
            name: 'ANWAP',
            url: 'https://mm.anwap.love',
            api: '/api/v2',
            searchEndpoint: '/search',
            detailsEndpoint: '/details'
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
                    throw new Error(`HTTP ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                }
                return await response.text();
            } catch (error) {
                console.error(`[My PL] HTTP Error:`, error.message);
                throw error;
            }
        }
    };

    // ========== PARSER UTILS ==========
    const Parser = {
        parseJSON: function(data) {
            try {
                return typeof data === 'string' ? JSON.parse(data) : data;
            } catch (e) {
                return null;
            }
        },

        extractQualities: function(data) {
            const qualities = {};
            const qualityPatterns = {
                '4k': /4k|2160p|ultra hd|uhd/i,
                '1080p': /1080p|full hd|fhd/i,
                '720p': /720p|hd/i,
                '480p': /480p|sd|standard/i
            };

            if (typeof data === 'string') {
                Object.entries(qualityPatterns).forEach(([q, regex]) => {
                    if (regex.test(data)) qualities[q] = data;
                });
            } else if (Array.isArray(data)) {
                data.forEach(item => {
                    if (typeof item === 'string') {
                        Object.entries(qualityPatterns).forEach(([q, regex]) => {
                            if (regex.test(item) && !qualities[q]) qualities[q] = item;
                        });
                    }
                });
            } else if (typeof data === 'object') {
                Object.entries(data).forEach(([key, value]) => {
                    Object.entries(qualityPatterns).forEach(([q, regex]) => {
                        if ((regex.test(key) || regex.test(value)) && !qualities[q] && typeof value === 'string') {
                            qualities[q] = value;
                        }
                    });
                });
            }

            return qualities;
        },

        extractUrl: function(data) {
            if (typeof data === 'string' && data.startsWith('http')) return data;
            if (typeof data === 'object') {
                if (data.url) return data.url;
                if (data.link) return data.link;
                if (data.src) return data.src;
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
        currentQuery: '',

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
                return [];
            }

            const cacheKey = `search_${query.toLowerCase()}`;
            const cached = Cache.get(cacheKey);
            if (cached) {
                console.log('[My PL] Using cached results for:', query);
                return cached;
            }

            console.log('[My PL] Searching for:', query);
            const results = [];

            const searchPromises = SOURCES.map(source => 
                this.searchSource(source, query).catch(() => [])
            );

            const sourceResults = await Promise.all(searchPromises);
            sourceResults.forEach(items => results.push(...items));

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

                let items = Array.isArray(parsed) ? parsed : parsed.results || parsed.items || parsed.data || [];

                return items.slice(0, 10).map((item, index) => ({
                    id: `${source.id}_${index}`,
                    source: source.name,
                    sourceId: source.id,
                    title: item.title || item.name || 'Unknown',
                    description: item.description || item.overview || '',
                    poster: item.poster || item.image || item.img || '',
                    year: item.year || item.release_date?.substring(0, 4) || '',
                    data: item
                }));
            } catch (error) {
                console.warn(`[My PL] Error searching ${source.name}:`, error.message);
                return [];
            }
        },

        getDetails: async function(itemId, itemData) {
            const qualities = Parser.extractQualities(itemData);
            const url = Parser.extractUrl(itemData);

            return {
                id: itemId,
                title: itemData.title || itemData.name || 'Unknown',
                description: itemData.description || itemData.overview || '',
                poster: itemData.poster || itemData.image || itemData.img || '',
                year: itemData.year || '',
                url: url || '',
                qualities: Object.keys(qualities).length > 0 ? qualities : { 'auto': url }
            };
        },

        playWithQuality: function(url, quality) {
            if (!url) {
                Lampa.Noty.show(this.getLang('noQuality'));
                return;
            }

            console.log(`[My PL] Playing: ${quality} - ${url}`);

            if (window.Lampa && window.Lampa.Player) {
                window.Lampa.Player.play({
                    url: url,
                    quality: quality,
                    title: this.currentTitle || 'Video'
                });
            } else {
                window.open(url, '_blank');
            }
        }
    };

    // ========== LAMPA COMPONENT - SEARCH & RESULTS ==========
    function MyPLSearchComponent(object) {
        const _this = this;
        const scroll = new Lampa.Scroll({ mask: true, over: true });
        const html = $('<div class="my-pl-search"></div>');
        const items = [];
        let currentResults = [];

        this.create = function() {
            // Show search input
            Lampa.Input.edit({
                free: true,
                nosave: true,
                value: object.query || ''
            }, function(query) {
                if (query && query.trim()) {
                    object.query = query;
                    _this.performSearch(query);
                } else {
                    Lampa.Controller.toggle('menu');
                }
            });

            return scroll.render();
        };

        this.performSearch = function(query) {
            Lampa.Loading.start();
            
            MyPLPlugin.search(query).then(results => {
                Lampa.Loading.stop();
                currentResults = results;

                if (results.length === 0) {
                    _this.empty();
                    return;
                }

                _this.build(results);
            }).catch(() => {
                Lampa.Loading.stop();
                _this.empty();
            });
        };

        this.build = function(results) {
            html.empty();
            items.length = 0;

            const grid = $('<div class="card--grid"></div>');

            results.forEach((item) => {
                const card = Lampa.Template.get('card', {
                    id: item.id,
                    title: item.title,
                    img: item.poster,
                    release_date: item.year
                });

                card.on('hover:enter', function() {
                    _this.openCard(item);
                });

                grid.append(card);
                items.push(card);
            });

            html.append(grid);
            scroll.append(html);
            Lampa.Controller.enable('content');
        };

        this.openCard = function(item) {
            Lampa.Activity.push({
                url: '',
                title: item.title,
                component: 'my-pl-card',
                card: item,
                page: 1
            });
        };

        this.empty = function() {
            html.html('<div class="empty">' + MyPLPlugin.getLang('noResults') + '</div>');
            scroll.append(html);
            Lampa.Controller.enable('content');
        };

        this.destroy = function() {
            html.remove();
            scroll.destroy();
        };
    }

    // ========== LAMPA COMPONENT - CARD DETAILS ==========
    function MyPLCardComponent(object) {
        const _this = this;
        const scroll = new Lampa.Scroll({ mask: true, over: true });
        const html = $('<div class="my-pl-card"></div>');
        const card = object.card;

        this.create = function() {
            html.html(`
                <div class="full full-start" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div class="full-start__body">
                        <img src="${card.poster || ''}" class="full-start__image" style="max-width: 300px; border-radius: 10px;">
                        <div class="full-start__content">
                            <h1>${card.title}</h1>
                            <p>${card.year || ''}</p>
                            <p style="color: #fff; font-size: 12px;">${card.source || ''}</p>
                            <p style="margin-top: 15px; color: #ccc;">${card.description || ''}</p>
                        </div>
                    </div>
                </div>
            `);

            scroll.append(html);
            
            // Show quality selection
            setTimeout(() => _this.selectQuality(), 500);
            
            return scroll.render();
        };

        this.selectQuality = async function() {
            const details = await MyPLPlugin.getDetails(card.id, card.data);
            const qualities = details.qualities;

            if (!qualities || Object.keys(qualities).length === 0) {
                Lampa.Noty.show(MyPLPlugin.getLang('noQuality'));
                return;
            }

            const items = Object.entries(qualities).map(([name, url]) => ({
                title: name,
                url: url
            }));

            Lampa.Select.show({
                title: MyPLPlugin.getLang('selectQuality'),
                items: items,
                onSelect: function(item) {
                    MyPLPlugin.currentTitle = card.title;
                    MyPLPlugin.playWithQuality(item.url, item.title);
                },
                onBack: function() {
                    Lampa.Controller.toggle('content');
                }
            });
        };

        this.destroy = function() {
            html.remove();
            scroll.destroy();
        };
    }

    // ========== PLUGIN INITIALIZATION ==========
    function startPlugin() {
        console.log(`[My PL] Starting v${PLUGIN_VERSION}...`);

        // Register components
        if (window.Lampa && window.Lampa.Component) {
            Lampa.Component.add('my-pl-search', MyPLSearchComponent);
            Lampa.Component.add('my-pl-card', MyPLCardComponent);
            console.log('[My PL] Components registered');
        }

        // Add menu button
        if (window.Lampa && window.Lampa.Menu) {
            Lampa.Menu.addButton('📺', MyPLPlugin.getLang('name'), function() {
                Lampa.Activity.push({
                    url: '',
                    title: MyPLPlugin.getLang('name'),
                    component: 'my-pl-search',
                    query: '',
                    page: 1
                });
            });
            console.log('[My PL] Menu button added');
        }

        // Export globally
        window.MyPLPlugin = MyPLPlugin;

        console.log('%c✅ My PL Plugin Ready', 'color: #667eea; font-size: 14px; font-weight: bold;');
    }

    // Wait for Lampa to be ready
    if (window.appready) {
        startPlugin();
    } else if (window.Lampa && window.Lampa.Listener) {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                startPlugin();
            }
        });
    } else {
        setTimeout(startPlugin, 2000);
    }

})();
