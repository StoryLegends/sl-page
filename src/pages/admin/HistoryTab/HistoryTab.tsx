import React, { useEffect, useState, useRef } from 'react';
import { 
    History as HistoryIcon, Plus, Edit, Trash2, Save, Eye, ArrowRight, Calendar, Palette, 
    Upload, Map as MapIcon, Image as ImageIcon, Download, Users, 
    ChevronDown, CheckCircle2, Lock, Globe
} from 'lucide-react';
import { uploadToImgur } from '../../../utils/imgur';
import { historyApi, type ServerHistory } from '../../../api/history';
import { useNotification } from '../../../context/NotificationContext';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';

const HistoryTab: React.FC = () => {
    const { showNotification } = useNotification();
    const [historyList, setHistoryList] = useState<ServerHistory[]>([]);
    const [loading, setLoading] = useState(true);

    // Active Editor State
    const [editingItem, setEditingItem] = useState<Partial<ServerHistory> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'SPLIT' | 'EDITOR_ONLY' | 'PREVIEW_ONLY'>('SPLIT');
    const [activeCards, setActiveCards] = useState<string[]>(['features']);
    const [cardMenuOpen, setCardMenuOpen] = useState(false);

    // Refs for synchronized scrolling
    const leftPanelRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);
    const isSyncingScrollRef = useRef(false);

    const handleLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isSyncingScrollRef.current) return;
        isSyncingScrollRef.current = true;
        const left = e.currentTarget;
        if (rightPanelRef.current) {
            const right = rightPanelRef.current;
            const leftMax = left.scrollHeight - left.clientHeight;
            const rightMax = right.scrollHeight - right.clientHeight;
            if (leftMax > 0 && rightMax > 0) {
                const ratio = left.scrollTop / leftMax;
                right.scrollTop = ratio * rightMax;
            }
        }
        requestAnimationFrame(() => {
            isSyncingScrollRef.current = false;
        });
    };

    const handleRightScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isSyncingScrollRef.current) return;
        isSyncingScrollRef.current = true;
        const right = e.currentTarget;
        if (leftPanelRef.current) {
            const left = leftPanelRef.current;
            const leftMax = left.scrollHeight - left.clientHeight;
            const rightMax = right.scrollHeight - right.clientHeight;
            if (leftMax > 0 && rightMax > 0) {
                const ratio = right.scrollTop / rightMax;
                left.scrollTop = ratio * leftMax;
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
        setActiveCards(['features']);
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
            logoJson: JSON.stringify({ image: '', description: '', second_description: '' }),
            mapsJson: JSON.stringify([]),
            photosJson: JSON.stringify([]),
            sortOrder: historyList.length + 1,
            published: false // Default to draft for new item
        });
    };

    const handleEdit = async (item: ServerHistory) => {
        let parsedColors = item.colors || [];
        if (typeof item.colorsJson === 'string') {
            try { parsedColors = JSON.parse(item.colorsJson); } catch {}
        }
        if (parsedColors.length === 0) parsedColors = ['#34383b', '#728697'];

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

        let folder = item.pathSlug || String(item.id);
        try {
            const indexRes = await fetch('/history-index.json');
            if (indexRes.ok) {
                const indexData = await indexRes.json();
                const found = indexData.find((i: any) => i.id === item.pathSlug || i.path === item.pathSlug || String(i.id) === String(item.id));
                if (found?.path) folder = found.path;
            }
        } catch {}

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

        const active: string[] = [];
        if (online || platform || workTime || runtime) active.push('features');
        if (logoObj.image) active.push('logo');
        if (mapsArr.length > 0) active.push('maps');
        if (photosArr.length > 0) active.push('photos');

        setActiveCards(active.length > 0 ? active : ['features']);

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
            photosJson: JSON.stringify(photosArr),
            published: item.published ?? true
        });
    };

    const handleSave = async (publishState?: boolean) => {
        if (!editingItem || !editingItem.title?.trim()) {
            showNotification('Заголовок истории не может быть пустым.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const isPublished = publishState !== undefined ? publishState : (editingItem.published ?? true);

            // Clean data if cards were removed
            const finalLogoJson = activeCards.includes('logo') ? editingItem.logoJson : JSON.stringify({ image: '', description: '', second_description: '' });
            const finalMapsJson = activeCards.includes('maps') ? editingItem.mapsJson : JSON.stringify([]);
            const finalPhotosJson = activeCards.includes('photos') ? editingItem.photosJson : JSON.stringify([]);

            const payload: Partial<ServerHistory> = {
                ...editingItem,
                published: isPublished,
                logoJson: finalLogoJson,
                mapsJson: finalMapsJson,
                photosJson: finalPhotosJson,
                colorsJson: JSON.stringify(editingItem.colors || ['#34383b', '#728697'])
            };
            const saved = await historyApi.saveHistory(payload);
            showNotification(isPublished ? 'История опубликована на сайте!' : 'Черновик успешно сохранен!', 'success');
            setEditingItem(prev => ({
                ...prev,
                ...saved,
                colors: editingItem.colors
            }));
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

    const toggleCard = (cardType: string) => {
        if (activeCards.includes(cardType)) {
            setActiveCards(activeCards.filter(c => c !== cardType));
        } else {
            setActiveCards([...activeCards, cardType]);
        }
        setCardMenuOpen(false);
    };

    if (editingItem) {
        const colors = editingItem.colors || ['#34383b', '#728697'];

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
        const isPublished = editingItem.published ?? true;

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
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <HistoryIcon className="w-5 h-5 text-story-gold" />
                                    {editingItem.id ? 'Редактирование истории' : 'Создание новой истории'}
                                </h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${isPublished ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                                    {isPublished ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                    {isPublished ? 'Опубликовано' : 'Черновик'}
                                </span>
                            </div>
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

                        {/* Save Buttons (Draft vs Publish) */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleSave(false)}
                                disabled={isSaving}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-all border border-white/10 flex items-center gap-1.5"
                                title="Сохранить изменений без публикации на сайте"
                            >
                                <Save className="w-4 h-4 text-yellow-400" />
                                {isSaving ? 'Сохранение...' : 'Сохранить черновик'}
                            </button>

                            <button
                                onClick={() => handleSave(true)}
                                disabled={isSaving}
                                className="px-5 py-2 bg-story-gold text-black rounded-xl hover:bg-story-gold-light font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
                            >
                                <Globe className="w-4 h-4" />
                                {isSaving ? 'Сохранение...' : 'Опубликовать'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Workspace split into 50/50 Screen Width */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT PANEL: Editor */}
                    {(previewMode === 'SPLIT' || previewMode === 'EDITOR_ONLY') && (
                        <div ref={leftPanelRef} onScroll={handleLeftScroll} className={`${previewMode === 'EDITOR_ONLY' ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl max-h-[85vh] overflow-y-auto`}>
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <h3 className="text-base font-bold text-white">Параметры и контент</h3>
                                
                                {/* Dropdown Menu to add side-cards */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setCardMenuOpen(!cardMenuOpen)}
                                        className="px-3 py-1.5 bg-story-gold/20 hover:bg-story-gold/30 text-story-gold border border-story-gold/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Добавить карточку
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>

                                    {cardMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-[#0c1626] border border-white/15 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => toggleCard('features')}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${activeCards.includes('features') ? 'bg-blue-500/20 text-blue-300' : 'text-gray-300 hover:bg-white/5'}`}
                                            >
                                                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> КарточкаИнформация</span>
                                                {activeCards.includes('features') && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => toggleCard('logo')}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${activeCards.includes('logo') ? 'bg-purple-500/20 text-purple-300' : 'text-gray-300 hover:bg-white/5'}`}
                                            >
                                                <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-purple-400" /> Карточка Логотип</span>
                                                {activeCards.includes('logo') && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => toggleCard('maps')}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${activeCards.includes('maps') ? 'bg-green-500/20 text-green-300' : 'text-gray-300 hover:bg-white/5'}`}
                                            >
                                                <span className="flex items-center gap-2"><MapIcon className="w-4 h-4 text-green-400" /> Ссылки на карты</span>
                                                {activeCards.includes('maps') && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => toggleCard('photos')}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${activeCards.includes('photos') ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-300 hover:bg-white/5'}`}
                                            >
                                                <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-yellow-400" /> Фотогалерея / Слайдшоу</span>
                                                {activeCards.includes('photos') && <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

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

                            {/* Dynamic Card 1: Features */}
                            {activeCards.includes('features') && (
                                <div className="border-t border-white/10 pt-4 bg-white/[0.02] p-4 rounded-xl space-y-3 relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-gray-300 font-bold text-xs flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-blue-400" />
                                            📊 Карточка информации (боковая панель)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => toggleCard('features')}
                                            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                                            title="Удалить карточку информации"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Удалить
                                        </button>
                                    </div>
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
                            )}

                            {/* Dynamic Card 2: Logo */}
                            {activeCards.includes('logo') && (
                                <div className="border-t border-white/10 pt-4 bg-white/[0.02] p-4 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-gray-300 font-bold text-xs flex items-center gap-1.5">
                                            <ImageIcon className="w-4 h-4 text-purple-400" />
                                            🖼️ Карточка логотипа сезона
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => toggleCard('logo')}
                                            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                                            title="Удалить карточку логотипа"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Удалить
                                        </button>
                                    </div>
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
                            )}

                            {/* Dynamic Card 3: Map Download Links */}
                            {activeCards.includes('maps') && (
                                <div className="border-t border-white/10 pt-4 bg-white/[0.02] p-4 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-gray-300 font-bold text-xs flex items-center gap-1.5">
                                            <MapIcon className="w-4 h-4 text-green-400" />
                                            🗺️ Ссылки на карты сезона
                                        </label>
                                        <div className="flex items-center gap-2">
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
                                            <button
                                                type="button"
                                                onClick={() => toggleCard('maps')}
                                                className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 ml-2"
                                                title="Удалить карточку карт"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Удалить
                                            </button>
                                        </div>
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
                            )}

                            {/* Dynamic Card 4: Photos / Gallery */}
                            {activeCards.includes('photos') && (
                                <div className="border-t border-white/10 pt-4 bg-white/[0.02] p-4 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-gray-300 font-bold text-xs flex items-center gap-1.5">
                                            <ImageIcon className="w-4 h-4 text-yellow-400" />
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
                                            <button
                                                type="button"
                                                onClick={() => toggleCard('photos')}
                                                className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 ml-2"
                                                title="Удалить фотогалерею"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Удалить
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
                            )}

                            {/* Rich Text Editor */}
                            <div className="space-y-2 pt-2">
                                <label className="block text-gray-300 font-bold text-xs">
                                    📝 Текст статьи и лора
                                </label>
                                <RichTextEditor
                                    value={editingItem.contentHtml || ''}
                                    onChange={html => setEditingItem({ ...editingItem, contentHtml: html })}
                                    minHeight="550px"
                                />
                            </div>
                        </div>
                    )}

                    {/* RIGHT PANEL: Live Preview (50/50 split) */}
                    {(previewMode === 'SPLIT' || previewMode === 'PREVIEW_ONLY') && (
                        <div ref={rightPanelRef} onScroll={handleRightScroll} className={`${previewMode === 'PREVIEW_ONLY' ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-6 bg-[#070d18] p-6 rounded-2xl border border-story-gold/30 shadow-2xl sticky top-4 max-h-[85vh] overflow-y-auto`}>
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <h3 className="text-base font-bold text-story-gold flex items-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    Предпросмотр страницы статьи
                                </h3>
                            </div>

                            {/* 1. Live Card Preview */}
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

                            {/* 2. Live Article Page Preview with Cards */}
                            <div className="space-y-6 pt-4 border-t border-white/10">
                                <span className="text-xs font-bold text-gray-400">2. Полная статья (/history/:id):</span>
                                
                                <div className="space-y-6">
                                    {/* Title Banner */}
                                    <div className="text-center py-4">
                                        <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: cardGradient }}>
                                            {editingItem.title || 'Заголовок истории'}
                                        </h1>
                                        <p className="text-gray-300 text-sm mt-2">{editingItem.description}</p>
                                    </div>

                                    {(() => {
                                        const hasValidLogo = activeCards.includes('logo') && currentLogo.image && currentLogo.image.trim() !== '';
                                        const validMaps = currentMaps.filter(m => m.url && m.url.trim() !== '');
                                        const hasValidMaps = activeCards.includes('maps') && validMaps.length > 0;
                                        const hasValidFeatures = activeCards.includes('features');
                                        const hasSideCards = hasValidFeatures || hasValidLogo || hasValidMaps;

                                        return (
                                            <div className={`grid grid-cols-1 ${hasSideCards ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
                                                {/* Main Content (Left, 100% width if no side cards) */}
                                                <div className={`p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 ${hasSideCards ? 'lg:col-span-7' : 'w-full'}`}>
                                                    <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Описание</h3>
                                                    <div
                                                        className="prose prose-invert max-w-none text-gray-300 text-xs leading-relaxed space-y-3"
                                                        dangerouslySetInnerHTML={{ __html: editingItem.contentHtml || '<p className="text-gray-500 italic">Контент пуст...</p>' }}
                                                    />
                                                </div>

                                                {/* Side Cards (Right) */}
                                                {hasSideCards && (
                                                    <div className="space-y-4 lg:col-span-5">
                                                        {/* Features Card */}
                                                        {hasValidFeatures && (
                                                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                                                <h3 className="text-base font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                                                                    <Users className="w-4 h-4 text-blue-400" /> Информация
                                                                </h3>
                                                                <div className="space-y-2 text-xs">
                                                                    <div className="flex justify-between"><span className="text-gray-400">Онлайн:</span> <span className="text-white font-bold">{editingItem.featureOnline || '—'}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-400">Платформа:</span> <span className="text-white font-bold">{editingItem.featurePlatform || '—'}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-400">Часы работы:</span> <span className="text-white font-bold">{editingItem.featureWorkTime || '—'}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-400">Продлился:</span> <span className="text-white font-bold">{editingItem.featureRuntime || '—'}</span></div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Logo Card */}
                                                        {hasValidLogo && (
                                                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-center">
                                                                <h3 className="text-base font-bold text-white border-b border-white/10 pb-2">Логотип</h3>
                                                                <div className="flex flex-col items-center">
                                                                    <img src={currentLogo.image} alt="Logo preview" className="max-h-24 object-contain mb-2 drop-shadow-md" />
                                                                    {currentLogo.description && <p className="text-xs text-white font-bold">{currentLogo.description}</p>}
                                                                    {currentLogo.second_description && <p className="text-[11px] text-gray-400">{currentLogo.second_description}</p>}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Maps Card */}
                                                        {hasValidMaps && (
                                                            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                                                <h3 className="text-base font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                                                                    <MapIcon className="w-4 h-4 text-green-400" /> Карта
                                                                </h3>
                                                                <div className="space-y-2">
                                                                    {validMaps.map((m, i) => (
                                                                        <a key={i} href={m.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors">
                                                                            <Download className="w-3.5 h-3.5 text-green-400" />
                                                                            {m.description || 'Скачать карту'}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Photos Gallery Card */}
                                    {activeCards.includes('photos') && currentPhotos.length > 0 && (
                                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                            <h3 className="text-base font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-yellow-400" /> Скриншоты сервера ({currentPhotos.length})
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {currentPhotos.map((p, i) => {
                                                    const src = typeof p === 'object' ? p.id : p;
                                                    return (
                                                        <div key={i} className="aspect-video bg-black/40 rounded-lg overflow-hidden border border-white/10 relative group">
                                                            {src ? (
                                                                <img src={src} alt="screenshot" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">Фото {i+1}</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
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
        <div className="space-y-6 w-full animate-fadeIn">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <HistoryIcon className="w-6 h-6 text-story-gold" />
                        История сервера
                    </h1>
                    <p className="text-sm text-gray-400">Управление страницами эпох, сезонов и детальным лором сервера</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="px-5 py-2.5 bg-story-gold text-black rounded-xl hover:bg-story-gold-light font-bold text-sm transition-all shadow-lg flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Создать эпоху
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Загрузка истории...</div>
                ) : historyList.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 space-y-3">
                        <HistoryIcon className="w-12 h-12 text-gray-500 mx-auto opacity-40" />
                        <p>Страницы истории пока не созданы.</p>
                        <button
                            onClick={handleCreateNew}
                            className="px-4 py-2 bg-story-gold/20 text-story-gold border border-story-gold/30 rounded-xl text-xs font-bold"
                        >
                            Создать первую эпоху
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {historyList.map(item => {
                            let colors = item.colors || [];
                            if (typeof item.colorsJson === 'string') {
                                try { colors = JSON.parse(item.colorsJson); } catch {}
                            }
                            if (colors.length === 0) colors = ['#34383b', '#728697'];

                            return (
                                <div key={item.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div
                                            className="w-4 h-12 rounded-full shrink-0 shadow-md"
                                            style={{ background: `linear-gradient(to bottom, ${colors[0]}, ${colors[1]})` }}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-story-gold bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                                                    /{item.pathSlug || item.id}
                                                </span>
                                                <h3 className="text-base font-bold text-white truncate">{item.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.published !== false ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                                                    {item.published !== false ? 'Опубликовано' : 'Черновик'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate max-w-xl">{item.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Редактировать
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id!)}
                                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
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
        </div>
    );
};

export default HistoryTab;
