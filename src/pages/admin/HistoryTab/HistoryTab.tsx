import React, { useEffect, useState, useRef } from 'react';
import { History as HistoryIcon, Plus, Edit, Trash2, Save, Eye, ArrowRight, Calendar, Palette, Upload, Map as MapIcon, Image as ImageIcon } from 'lucide-react';
import { uploadToImgur } from '../../../utils/imgur';
import { historyApi, type ServerHistory } from '../../../api/history';
import { useNotification } from '../../../context/NotificationContext';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';

const HistoryTab: React.FC = () => {
    const { showNotification } = useNotification();
    const [historyList, setHistoryList] = useState<ServerHistory[]>([]);
    const [loading, setLoading] = useState(true);

    // Active Editor State - Full Window inside Admin Workspace
    const [editingItem, setEditingItem] = useState<Partial<ServerHistory> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'SPLIT' | 'EDITOR_ONLY' | 'PREVIEW_ONLY'>('SPLIT');

    // Refs for synchronized scrolling
    const leftPanelRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);
    const isSyncingScrollRef = useRef(false);

    const handleLeftScroll = () => {
        if (isSyncingScrollRef.current) return;
        isSyncingScrollRef.current = true;
        if (leftPanelRef.current && rightPanelRef.current) {
            const left = leftPanelRef.current;
            const right = rightPanelRef.current;
            const scrollableHeight = left.scrollHeight - left.clientHeight;
            if (scrollableHeight > 0) {
                const percentage = left.scrollTop / scrollableHeight;
                right.scrollTop = percentage * (right.scrollHeight - right.clientHeight);
            }
        }
        requestAnimationFrame(() => {
            isSyncingScrollRef.current = false;
        });
    };

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await historyApi.getAdminHistory();
            setHistoryList(data);
        } catch (err) {
            console.error('Failed to load history list', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleCreateNew = () => {
        const nextSlug = String(Date.now());
        setEditingItem({
            title: 'Новая страница истории',
            description: 'Краткое описание эпохи...',
            pathSlug: nextSlug,
            eventDate: '2025',
            featureOnline: '8-10 человек в среднем',
            featurePlatform: 'Minecraft Java + Bedrock',
            featureWorkTime: 'Круглосуточно',
            featureRuntime: '~ 3 месяца',
            colorsJson: JSON.stringify(['#34383b', '#728697']),
            colors: ['#34383b', '#728697'],
            contentHtml: '<h2>Заголовок эпохи</h2><p>Напишите подробный лор и историю этого периода...</p>',
            sortOrder: historyList.length + 1,
            published: true
        });
    };

    const handleEdit = async (item: ServerHistory) => {
        let parsedColors = item.colors || [];
        if (typeof item.colorsJson === 'string') {
            try { parsedColors = JSON.parse(item.colorsJson); } catch {}
        }
        if (parsedColors.length === 0) parsedColors = ['#34383b', '#728697'];

        // Determine folder path for loading static details fallback
        let folder = item.pathSlug || String(item.id);
        try {
            const indexRes = await fetch('/history-index.json');
            if (indexRes.ok) {
                const indexData = await indexRes.json();
                const found = indexData.find((i: any) => i.id === item.pathSlug || i.path === item.pathSlug || String(i.id) === String(item.id));
                if (found?.path) folder = found.path;
            }
        } catch {}

        let logoObj = { image: '', description: '', second_description: '' };
        if (typeof item.logoJson === 'string') {
            try { logoObj = JSON.parse(item.logoJson); } catch {}
        }

        let mapsArr: Array<{ description: string; url: string }> = [];
        if (typeof item.mapsJson === 'string') {
            try { mapsArr = JSON.parse(item.mapsJson); } catch {}
        }

        let photosArr: Array<{ id: string; description: string }> = [];
        if (typeof item.photosJson === 'string') {
            try {
                const raw = JSON.parse(item.photosJson);
                if (Array.isArray(raw)) {
                    photosArr = raw.map((p: any) => typeof p === 'object' ? p : { id: String(p), description: '' });
                }
            } catch {}
        }

        let online = item.featureOnline || '';
        let platform = item.featurePlatform || '';
        let workTime = item.featureWorkTime || '';
        let runtime = item.featureRuntime || '';
        let contentHtml = item.contentHtml || '';

        try {
            const detailsRes = await fetch(`/history/${encodeURIComponent(folder)}/details.json`);
            if (detailsRes.ok) {
                const details = await detailsRes.json();
                if (details.seasons && details.seasons.length > 0) {
                    const s0 = details.seasons[0];
                    if (!online && s0.features?.online) online = s0.features.online;
                    if (!platform && s0.features?.platform) platform = s0.features.platform;
                    if (!workTime && s0.features?.work_time) workTime = s0.features.work_time;
                    if (!runtime && s0.features?.runtime) runtime = s0.features.runtime;
                    if (!contentHtml || contentHtml.trim() === '' || contentHtml.includes('Заголовок эпохи')) {
                        contentHtml = details.seasons.map((s: any) => `<h2>${s.name} ${s.s_description ? '— ' + s.s_description : ''}</h2><p>${s.description || ''}</p>`).join('') || details.description || '';
                    }
                    if (!logoObj.image && s0.logo) {
                        const l = Array.isArray(s0.logo) ? s0.logo[0] : s0.logo;
                        if (l) logoObj = { image: l.image || '', description: l.description || '', second_description: l.second_description || '' };
                    }
                    if (mapsArr.length === 0 && s0.map) {
                        mapsArr = Array.isArray(s0.map) ? s0.map : [s0.map];
                    }
                    if (photosArr.length === 0 && s0.photos) {
                        photosArr = s0.photos.map((p: any) => typeof p === 'object' ? p : { id: String(p), description: '' });
                    }
                }
            }
        } catch {}

        setEditingItem({
            ...item,
            featureOnline: online || '8-10 человек в среднем',
            featurePlatform: platform || 'Minecraft Java + Bedrock',
            featureWorkTime: workTime || 'Круглосуточно',
            featureRuntime: runtime || '~ 3 месяца',
            contentHtml: contentHtml || '<h2>Заголовок эпохи</h2><p>Напишите подробный лор и историю этого периода...</p>',
            colors: parsedColors,
            logoJson: JSON.stringify(logoObj),
            mapsJson: JSON.stringify(mapsArr),
            photosJson: JSON.stringify(photosArr)
        });
    };

    const handleSave = async () => {
        if (!editingItem || !editingItem.title?.trim()) {
            showNotification('Заголовок истории не может быть пустым.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const payload: Partial<ServerHistory> = {
                ...editingItem,
                colorsJson: JSON.stringify(editingItem.colors || ['#34383b', '#728697'])
            };
            await historyApi.saveHistory(payload);
            showNotification('История сервера успешно сохранена!', 'success');
            setEditingItem(null);
            loadHistory();
        } catch (err) {
            console.error(err);
            showNotification('Ошибка при сохранении истории.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить эту страницу истории?')) return;
        try {
            await historyApi.deleteHistory(id);
            showNotification('Страница истории удалена.', 'success');
            loadHistory();
        } catch (err) {
            showNotification('Ошибка при удалении.', 'error');
        }
    };

    // If an item is being edited, render Full-Window Editor inside workspace
    if (editingItem) {
        const colors = editingItem.colors || ['#34383b', '#728697'];

        // Parse helpers for logo, maps, and photos
        let currentLogo = { image: '', description: '', second_description: '' };
        if (typeof editingItem.logoJson === 'string') {
            try { currentLogo = JSON.parse(editingItem.logoJson); } catch {}
        }

        let currentMaps: Array<{ description: string; url: string }> = [];
        if (typeof editingItem.mapsJson === 'string') {
            try { currentMaps = JSON.parse(editingItem.mapsJson); } catch {}
        }

        let currentPhotos: any[] = [];
        if (typeof editingItem.photosJson === 'string') {
            try { currentPhotos = JSON.parse(editingItem.photosJson); } catch {}
        }

        const updateLogo = (patch: Partial<{ image: string; description: string; second_description: string }>) => {
            const updated = { ...currentLogo, ...patch };
            setEditingItem({ ...editingItem, logoJson: JSON.stringify(updated) });
        };
        const cardGradient = `linear-gradient(135deg, ${colors[0] || '#34383b'} 0%, ${colors[1] || '#728697'} 100%)`;

        return (
            <div className="space-y-6 w-full animate-fadeIn">
                {/* Full-Window Editor Top Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                        >
                            ← Назад к списку
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <HistoryIcon className="w-5 h-5 text-story-gold" />
                                {editingItem.id ? 'Редактирование истории' : 'Создание новой истории'}
                            </h2>
                            <p className="text-xs text-gray-400">Полноэкранный редактор истории с предпросмотром в реальном времени</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Switchers */}
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
                            <button
                                onClick={() => setPreviewMode('SPLIT')}
                                className={`px-3 py-1 rounded-lg ${previewMode === 'SPLIT' ? 'bg-story-gold text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                50/50 Вид
                            </button>
                            <button
                                onClick={() => setPreviewMode('EDITOR_ONLY')}
                                className={`px-3 py-1 rounded-lg ${previewMode === 'EDITOR_ONLY' ? 'bg-story-gold text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                Только Редактор
                            </button>
                            <button
                                onClick={() => setPreviewMode('PREVIEW_ONLY')}
                                className={`px-3 py-1 rounded-lg ${previewMode === 'PREVIEW_ONLY' ? 'bg-story-gold text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                Только Предпросмотр
                            </button>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 bg-story-gold text-black rounded-xl hover:bg-story-gold-light font-bold text-xs transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>

                {/* Main Workspace split into Left (Editor) and Right (Live Preview) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT PANEL: Editor */}
                    {(previewMode === 'SPLIT' || previewMode === 'EDITOR_ONLY') && (
                        <div ref={leftPanelRef} onScroll={handleLeftScroll} className={`${previewMode === 'EDITOR_ONLY' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl max-h-[85vh] overflow-y-auto`}>
                            <h3 className="text-base font-bold text-white border-b border-white/10 pb-2">Параметры и контент</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Заголовок страницы *</label>
                                    <input
                                        type="text"
                                        value={editingItem.title || ''}
                                        onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-bold text-sm focus:outline-none focus:border-story-gold/50"
                                        placeholder="например, SL Ancient Fog"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">URL-слаг (ID пути) *</label>
                                    <input
                                        type="text"
                                        value={editingItem.pathSlug || ''}
                                        onChange={e => setEditingItem({ ...editingItem, pathSlug: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-story-gold/50"
                                        placeholder="5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Дата / Даты события</label>
                                    <input
                                        type="text"
                                        value={editingItem.eventDate || ''}
                                        onChange={e => setEditingItem({ ...editingItem, eventDate: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                        placeholder="10-05-2025 или 2023-2024"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Порядок сортировки</label>
                                    <input
                                        type="number"
                                        value={editingItem.sortOrder || 1}
                                        onChange={e => setEditingItem({ ...editingItem, sortOrder: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs text-center font-mono focus:outline-none focus:border-story-gold/50"
                                    />
                                </div>
                            </div>

                            {/* Color Pickers for Timeline Card */}
                            <div>
                                <label className="block text-gray-300 font-bold mb-1.5 flex items-center gap-1.5 text-xs">
                                    <Palette className="w-4 h-4 text-story-gold" />
                                    Цвета градиента таймлайн-карточки (Цвет 1 и Цвет 2):
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={colors[0] || '#34383b'}
                                        onChange={e => {
                                            const newColors = [e.target.value, colors[1] || '#728697'];
                                            setEditingItem({ ...editingItem, colors: newColors });
                                        }}
                                        className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-white/20"
                                    />
                                    <input
                                        type="color"
                                        value={colors[1] || '#728697'}
                                        onChange={e => {
                                            const newColors = [colors[0] || '#34383b', e.target.value];
                                            setEditingItem({ ...editingItem, colors: newColors });
                                        }}
                                        className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-white/20"
                                    />
                                    <span className="text-xs font-mono text-gray-400">
                                        {colors[0]} → {colors[1]}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 font-bold mb-1 text-xs">Краткое описание (для списков)</label>
                                <textarea
                                    rows={2}
                                    value={editingItem.description || ''}
                                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                    placeholder="Новые главы истории сервера..."
                                />
                            </div>

                            {/* Season Info / Features */}
                            <div className="border-t border-white/10 pt-4">
                                <label className="block text-gray-300 font-bold mb-2 text-xs flex items-center gap-1.5">
                                    📊 Краткая информация (боковая панель)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <label className="block text-gray-400 mb-1">Онлайн</label>
                                        <input
                                            type="text"
                                            value={editingItem.featureOnline || ''}
                                            onChange={e => setEditingItem({ ...editingItem, featureOnline: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                            placeholder="8-10 человек в среднем"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-1">Платформа</label>
                                        <input
                                            type="text"
                                            value={editingItem.featurePlatform || ''}
                                            onChange={e => setEditingItem({ ...editingItem, featurePlatform: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                            placeholder="Java & Bedrock"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-1">Часы работы</label>
                                        <input
                                            type="text"
                                            value={editingItem.featureWorkTime || ''}
                                            onChange={e => setEditingItem({ ...editingItem, featureWorkTime: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                            placeholder="Круглосуточно"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-1">Продолжительность</label>
                                        <input
                                            type="text"
                                            value={editingItem.featureRuntime || ''}
                                            onChange={e => setEditingItem({ ...editingItem, featureRuntime: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                            placeholder="+- 3 месяца"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 1: Logo Card Editor */}
                            <div className="border-t border-white/10 pt-4 space-y-3">
                                <label className="block text-gray-300 font-bold text-xs flex items-center gap-1.5">
                                    <ImageIcon className="w-4 h-4 text-purple-400" />
                                    🖼️ Карточка логотипа сезона
                                </label>
                                <div className="space-y-2 text-xs">
                                    <div>
                                        <label className="block text-gray-400 mb-1">Ссылка на логотип (URL или файл)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={currentLogo.image || ''}
                                                onChange={e => updateLogo({ image: e.target.value })}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                                placeholder="https://i.imgur.com/... или logo.png"
                                            />
                                            <label className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded-xl cursor-pointer font-bold flex items-center gap-1 shrink-0">
                                                <Upload className="w-3.5 h-3.5" />
                                                Загрузить
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        try {
                                                            const url = await uploadToImgur(file);
                                                            updateLogo({ image: url });
                                                            showNotification('Логотип загружен!', 'success');
                                                        } catch (err) {
                                                            showNotification('Ошибка загрузки логотипа', 'error');
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-gray-400 mb-1">Заголовок под лого</label>
                                            <input
                                                type="text"
                                                value={currentLogo.description || ''}
                                                onChange={e => updateLogo({ description: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                                placeholder="Лого сезона"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 mb-1">Подзаголовок под лого</label>
                                            <input
                                                type="text"
                                                value={currentLogo.second_description || ''}
                                                onChange={e => updateLogo({ second_description: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                                placeholder="Лого сервера с названием сезона"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Season Map Download Links Editor */}
                            <div className="border-t border-white/10 pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-gray-300 font-bold text-xs flex items-center gap-1.5">
                                        <MapIcon className="w-4 h-4 text-green-400" />
                                        🗺️ Ссылки на карты сезона
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...currentMaps, { description: 'Карта сезона', url: 'https://' }];
                                            setEditingItem({ ...editingItem, mapsJson: JSON.stringify(updated) });
                                        }}
                                        className="px-2.5 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg text-xs font-bold flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Добавить карту
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {currentMaps.length === 0 ? (
                                        <p className="text-gray-500 text-xs italic">Ссылки на скачивание карты пока не добавлены.</p>
                                    ) : (
                                        currentMaps.map((m, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-black/30 p-2 rounded-xl border border-white/10">
                                                <input
                                                    type="text"
                                                    value={m.description || ''}
                                                    onChange={e => {
                                                        const updated = [...currentMaps];
                                                        updated[idx] = { ...updated[idx], description: e.target.value };
                                                        setEditingItem({ ...editingItem, mapsJson: JSON.stringify(updated) });
                                                    }}
                                                    className="w-1/3 bg-black/50 border border-white/10 rounded-lg p-1.5 text-white text-xs"
                                                    placeholder="Название (напр. Финал сезона)"
                                                />
                                                <input
                                                    type="text"
                                                    value={m.url || ''}
                                                    onChange={e => {
                                                        const updated = [...currentMaps];
                                                        updated[idx] = { ...updated[idx], url: e.target.value };
                                                        setEditingItem({ ...editingItem, mapsJson: JSON.stringify(updated) });
                                                    }}
                                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg p-1.5 text-white text-xs"
                                                    placeholder="URL файла карты..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = currentMaps.filter((_, i) => i !== idx);
                                                        setEditingItem({ ...editingItem, mapsJson: JSON.stringify(updated) });
                                                    }}
                                                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Удалить карту"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Screenshot Slideshow / Photo Gallery */}
                            <div className="border-t border-white/10 pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-gray-300 font-bold text-xs flex items-center gap-1.5">
                                        <ImageIcon className="w-4 h-4 text-blue-400" />
                                        📸 Фотогалерея и слайдшоу скриншотов
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <label className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1">
                                            <Upload className="w-3.5 h-3.5" />
                                            Загрузить фото
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    try {
                                                        const url = await uploadToImgur(file);
                                                        const updated = [...currentPhotos, { id: url, description: '' }];
                                                        setEditingItem({ ...editingItem, photosJson: JSON.stringify(updated) });
                                                        showNotification('Фото добавлено в галерею!', 'success');
                                                    } catch (err) {
                                                        showNotification('Ошибка загрузки фото', 'error');
                                                    }
                                                }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = [...currentPhotos, { id: '', description: '' }];
                                                setEditingItem({ ...editingItem, photosJson: JSON.stringify(updated) });
                                            }}
                                            className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            URL фото
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {currentPhotos.length === 0 ? (
                                        <p className="text-gray-500 text-xs italic">Скриншоты пока не добавлены.</p>
                                    ) : (
                                        currentPhotos.map((p, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-black/30 p-2 rounded-xl border border-white/10">
                                                <input
                                                    type="text"
                                                    value={typeof p === 'object' ? p.id : p}
                                                    onChange={e => {
                                                        const updated = [...currentPhotos];
                                                        const photoUrl = e.target.value;
                                                        if (typeof updated[idx] === 'object') {
                                                            updated[idx] = { ...updated[idx], id: photoUrl };
                                                        } else {
                                                            updated[idx] = photoUrl;
                                                        }
                                                        setEditingItem({ ...editingItem, photosJson: JSON.stringify(updated) });
                                                    }}
                                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg p-1.5 text-white text-xs font-mono"
                                                    placeholder="URL изображения..."
                                                />
                                                <input
                                                    type="text"
                                                    value={typeof p === 'object' ? p.description || '' : ''}
                                                    onChange={e => {
                                                        const updated = [...currentPhotos];
                                                        const desc = e.target.value;
                                                        const currentId = typeof updated[idx] === 'object' ? updated[idx].id : updated[idx];
                                                        updated[idx] = { id: currentId, description: desc };
                                                        setEditingItem({ ...editingItem, photosJson: JSON.stringify(updated) });
                                                    }}
                                                    className="w-1/3 bg-black/50 border border-white/10 rounded-lg p-1.5 text-white text-xs"
                                                    placeholder="Подпись к фото..."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = currentPhotos.filter((_, i) => i !== idx);
                                                        setEditingItem({ ...editingItem, photosJson: JSON.stringify(updated) });
                                                    }}
                                                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Удалить фото"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Rich Text Editor */}
                            <div className="space-y-2 pt-2">
                                <label className="block text-gray-300 font-bold text-xs">
                                    📝 Текст статьи и лора
                                </label>
                                <RichTextEditor
                                    value={editingItem.contentHtml || ''}
                                    onChange={html => setEditingItem({ ...editingItem, contentHtml: html })}
                                    minHeight="480px"
                                />
                            </div>
                        </div>
                    )}

                    {/* RIGHT PANEL: Live Preview */}
                    {(previewMode === 'SPLIT' || previewMode === 'PREVIEW_ONLY') && (
                        <div ref={rightPanelRef} className={`${previewMode === 'PREVIEW_ONLY' ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-6 bg-[#070d18] p-6 rounded-2xl border border-story-gold/30 shadow-2xl sticky top-4 max-h-[85vh] overflow-y-auto`}>
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <h3 className="text-base font-bold text-story-gold flex items-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    Предпросмотр в реальном времени
                                </h3>
                                
                            </div>

                            {/* Live Card Preview */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-gray-400">1. Таймлайн карточка (/history):</span>
                                <div
                                    className="p-6 rounded-2xl border border-white/10 shadow-xl transition-all relative overflow-hidden"
                                    style={{ background: cardGradient }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-mono text-white/80 flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-full border border-white/10">
                                            <Calendar className="w-3 h-3 text-story-gold" />
                                            {editingItem.eventDate || 'Дата'}
                                        </span>
                                    </div>
                                    <h4 className="text-2xl font-bold text-white mb-2">{editingItem.title || 'Заголовок'}</h4>
                                    <p className="text-gray-200 text-sm line-clamp-2 leading-relaxed mb-4">{editingItem.description}</p>
                                    <div className="inline-flex items-center gap-2 text-xs font-bold text-story-gold bg-black/40 px-3 py-1.5 rounded-xl border border-story-gold/30">
                                        Читать историю
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Live Article Preview */}
                            <div className="space-y-2 pt-4 border-t border-white/10">
                                <span className="text-xs font-bold text-gray-400">2. Детальная статья статьи (/history/:id):</span>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                    <h1 className="text-3xl font-bold text-white">{editingItem.title}</h1>
                                    <div
                                        className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed space-y-4"
                                        dangerouslySetInnerHTML={{ __html: editingItem.contentHtml || '<p className="text-gray-500 italic">Контент пуст...</p>' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default History Items List View
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <HistoryIcon className="w-6 h-6 text-story-gold" />
                        История сервера (Server History CMS)
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Управление эпохами и статьями истории сервера без перезапуска сайта</p>
                </div>

                <button
                    onClick={handleCreateNew}
                    className="px-4 py-2.5 bg-story-gold text-black rounded-xl hover:bg-story-gold-light font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Создать новую историю
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Загрузка историй сервера...</div>
            ) : historyList.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">История сервера пока не добавлена.</div>
            ) : (
                <div className="space-y-4">
                    {historyList.map(item => {
                        let colors = item.colors || [];
                        if (typeof item.colorsJson === 'string') {
                            try { colors = JSON.parse(item.colorsJson); } catch {}
                        }
                        if (colors.length === 0) colors = ['#34383b', '#728697'];

                        return (
                            <div key={item.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-md shrink-0"
                                        style={{ background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)` }}
                                    >
                                        {item.pathSlug || item.id}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">{item.title}</h4>
                                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.description}</p>
                                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 font-mono">
                                            <span>Дата: {item.eventDate || '—'}</span>
                                            <span>• Слаг: /{item.pathSlug}</span>
                                            <span>• Сортировка: {item.sortOrder}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="px-4 py-2 rounded-xl bg-story-gold/20 text-story-gold border border-story-gold/30 hover:bg-story-gold/30 transition-colors text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Открыть редактор
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id!)}
                                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                                        title="Удалить"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HistoryTab;
