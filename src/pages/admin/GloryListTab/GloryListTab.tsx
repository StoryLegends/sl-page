import React, { useEffect, useState } from 'react';
import { Crown, Plus, Edit, Trash2, X, ExternalLink, Upload } from 'lucide-react';
import { glorylistApi, resolveGloryImage, type GloryItem, type GloryLink } from '../../../api/glorylist';
import { useNotification } from '../../../context/NotificationContext';
import { uploadToImgur } from '../../../utils/imgur';

const GloryListTab: React.FC = () => {
    const { showNotification } = useNotification();
    const [items, setItems] = useState<GloryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    // Editing modal / form state
    const [editingItem, setEditingItem] = useState<Partial<GloryItem> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await glorylistApi.getAdminGloryItems();
            setItems(data);
        } catch (err) {
            console.error('Failed to load glory items', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const handleCreateNew = () => {
        setEditingItem({
            name: '',
            category: 'Legends',
            image: '',
            description: '',
            details: '',
            discord: '',
            links: [],
            sortOrder: items.length + 1,
            active: true
        });
    };

    const handleSaveItem = async () => {
        if (!editingItem || !editingItem.name?.trim()) {
            showNotification('Укажите имя персонажа или участника.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const payload: Partial<GloryItem> = {
                ...editingItem,
                linksJson: JSON.stringify(editingItem.links || [])
            };
            await glorylistApi.saveGloryItem(payload);
            showNotification('Запись в Зале Славы успешно сохранена!', 'success');
            setEditingItem(null);
            loadItems();
        } catch (err) {
            console.error(err);
            showNotification('Ошибка при сохранении.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('Вы уверены, что хотите удалить эту запись из Зала Славы?')) return;
        try {
            await glorylistApi.deleteGloryItem(id);
            showNotification('Запись удалена.', 'success');
            loadItems();
        } catch (err) {
            showNotification('Ошибка при удалении.', 'error');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const link = await uploadToImgur(file);
            setEditingItem(prev => prev ? { ...prev, image: link } : null);
            showNotification('Изображение загружено!', 'success');
        } catch (err) {
            showNotification('Не удалось загрузить изображение.', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAddLink = () => {
        if (!editingItem) return;
        const links = editingItem.links || [];
        setEditingItem({ ...editingItem, links: [...links, { name: 'YouTube', url: '' }] });
    };

    const handleRemoveLink = (idx: number) => {
        if (!editingItem) return;
        const links = [...(editingItem.links || [])];
        links.splice(idx, 1);
        setEditingItem({ ...editingItem, links });
    };

    const filteredItems = items.filter(i => selectedCategory === 'ALL' || i.category === selectedCategory);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Crown className="w-6 h-6 text-story-gold" />
                        Зал Славы (GloryList CMS)
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Динамическое управление карточками легенд, контент-мейкеров и команды сервера</p>
                </div>

                <button
                    onClick={handleCreateNew}
                    className="px-4 py-2.5 bg-story-gold text-black rounded-xl hover:bg-story-gold-light font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Добавить карточку
                </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 w-fit text-xs">
                {['ALL', 'Legends', 'ContenMakers', 'Staff'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${selectedCategory === cat ? 'bg-story-gold text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        {cat === 'ALL' ? 'Все категории' : cat === 'Legends' ? 'Легенды' : cat === 'ContenMakers' ? 'Контент-мейкеры' : 'Команда'}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Загрузка карточек Зала Славы...</div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">Записи отсутствуют.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map(item => {
                        let parsedLinks: GloryLink[] = [];
                        if (item.linksJson) {
                            try { parsedLinks = JSON.parse(item.linksJson); } catch {}
                        } else if (item.links) {
                            parsedLinks = item.links;
                        }

                        return (
                            <div key={item.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={resolveGloryImage(item.image, item.name)}
                                                alt={item.name}
                                                className="w-12 h-12 rounded-xl object-cover border border-white/20 bg-black/40"
                                            />
                                            <div>
                                                <h4 className="text-white font-bold text-base">{item.name}</h4>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-story-gold border border-story-gold/20">
                                                    {item.category}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {item.active ? 'Активен' : 'Скрыт'}
                                        </span>
                                    </div>

                                    <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed">
                                        {item.description}
                                    </p>

                                    {parsedLinks.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {parsedLinks.map((l, idx) => (
                                                <a
                                                    key={idx}
                                                    href={l.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] border border-white/10"
                                                >
                                                    <ExternalLink className="w-3 h-3 text-story-gold" />
                                                    {l.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                                    <span className="text-gray-500 font-mono">Сортировка: {item.sortOrder}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingItem({
                                                    ...item,
                                                    links: parsedLinks
                                                });
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-colors flex items-center gap-1"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Изменить
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(item.id!)}
                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                                            title="Удалить"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit / Create Form Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0e1a2e] border border-white/10 rounded-2xl p-6 max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto text-white">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Crown className="w-5 h-5 text-story-gold" />
                                {editingItem.id ? 'Редактировать запись' : 'Новая запись Зала Славы'}
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="p-1 text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="block text-gray-300 font-bold mb-1">Имя / Никнейм *</label>
                                <input
                                    type="text"
                                    value={editingItem.name || ''}
                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-story-gold/50"
                                    placeholder="например, Mr. Yan"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Категория</label>
                                    <select
                                        value={editingItem.category || 'Legends'}
                                        onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                    >
                                        <option value="Legends">Легенды (Legends)</option>
                                        <option value="ContenMakers">Контент-мейкеры (ContenMakers)</option>
                                        <option value="Staff">Команда сервера (Staff)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-300 font-bold mb-1">Порядок сортировки</label>
                                    <input
                                        type="number"
                                        value={editingItem.sortOrder || 1}
                                        onChange={e => setEditingItem({ ...editingItem, sortOrder: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-xs text-center font-mono focus:outline-none focus:border-story-gold/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 font-bold mb-1">Ссылка на изображение или Imgur</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editingItem.image || ''}
                                        onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                        placeholder="https://i.imgur.com/... или yan.webp"
                                    />
                                    <label className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                                        <Upload className="w-3.5 h-3.5" />
                                        {uploadingImage ? 'Загрузка...' : 'Загрузить файл'}
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 font-bold mb-1">Краткое описание (в списках)</label>
                                <input
                                    type="text"
                                    value={editingItem.description || ''}
                                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                    placeholder="Создатель всей истории серверов."
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 font-bold mb-1">Подробное описание (в модальном окне)</label>
                                <textarea
                                    rows={3}
                                    value={editingItem.details || ''}
                                    onChange={e => setEditingItem({ ...editingItem, details: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                    placeholder="Полный текст о роли участника..."
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 font-bold mb-1">Discord Никнейм</label>
                                <input
                                    type="text"
                                    value={editingItem.discord || ''}
                                    onChange={e => setEditingItem({ ...editingItem, discord: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-story-gold/50"
                                    placeholder="lendspele_"
                                />
                            </div>

                            {/* Custom Social Links */}
                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <label className="text-gray-300 font-bold">Ссылки (YouTube, Twitch, VK и т.д.):</label>
                                    <button
                                        type="button"
                                        onClick={handleAddLink}
                                        className="text-story-gold hover:underline font-bold text-xs"
                                    >
                                        + Добавить ссылку
                                    </button>
                                </div>

                                {(editingItem.links || []).map((l, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Название (YouTube)"
                                            value={l.name}
                                            onChange={e => {
                                                const links = [...(editingItem.links || [])];
                                                links[idx].name = e.target.value;
                                                setEditingItem({ ...editingItem, links });
                                            }}
                                            className="w-1/3 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-xs"
                                        />
                                        <input
                                            type="text"
                                            placeholder="URL (https://...)"
                                            value={l.url}
                                            onChange={e => {
                                                const links = [...(editingItem.links || [])];
                                                links[idx].url = e.target.value;
                                                setEditingItem({ ...editingItem, links });
                                            }}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLink(idx)}
                                            className="p-1.5 text-red-400 hover:text-red-300"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSaveItem}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-story-gold text-black rounded-xl font-bold text-xs hover:bg-story-gold-light transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Сохранение...' : 'Сохранить карточку'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GloryListTab;
