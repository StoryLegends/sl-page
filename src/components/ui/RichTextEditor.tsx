import React, { useRef, useEffect, useState } from 'react';
import {
    Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Link as LinkIcon,
    Code, Eye, Upload, Minus
} from 'lucide-react';
import { uploadToImgur } from '../../utils/imgur';
import { useNotification } from '../../context/NotificationContext';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    minHeight = '450px'
}) => {
    const { showNotification } = useNotification();
    const editorRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<'VISUAL' | 'CODE'>('VISUAL');
    const [uploading, setUploading] = useState(false);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);

    // Sync content to contentEditable div when external value changes or mode switches
    useEffect(() => {
        if (mode === 'VISUAL' && editorRef.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value || '';
            }
        }
    }, [value, mode]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleFormatBlock = (tag: string) => {
        if (!tag) return;
        if (tag === 'callout') {
            const calloutHtml = `<div class="p-4 my-4 bg-white/5 border-l-4 border-amber-500 rounded-r-xl text-gray-200 text-sm shadow-md"><strong>💡 Обратите внимание:</strong> Напишите важную деталь или анонс...</div>`;
            exec('insertHTML', calloutHtml);
            return;
        }
        exec('formatBlock', tag);
    };

    const handleInsertLink = () => {
        const url = prompt('Введите URL ссылки:', 'https://');
        if (url) {
            const selectedText = window.getSelection()?.toString();
            if (selectedText) {
                exec('createLink', url);
            } else {
                const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-story-gold underline hover:text-amber-300 font-semibold">${url}</a>`;
                exec('insertHTML', linkHtml);
            }
        }
    };

    const handleInsertHr = () => {
        exec('insertHTML', '<hr class="my-6 border-white/10" />');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const link = await uploadToImgur(file);
            const imgHtml = `<p class="my-4"><img src="${link}" alt="Uploaded photo" class="w-full max-h-[500px] object-cover rounded-2xl border border-white/10 shadow-xl" /></p><p></p>`;
            exec('insertHTML', imgHtml);
            showNotification('Изображение успешно загружено в статью!', 'success');
        } catch (err) {
            showNotification('Не удалось загрузить изображение.', 'error');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const colorPalette = [
        { name: 'Золотой', color: '#f59e0b' },
        { name: 'Белый', color: '#ffffff' },
        { name: 'Серый', color: '#9ca3af' },
        { name: 'Красный', color: '#ef4444' },
        { name: 'Зеленый', color: '#10b981' },
        { name: 'Голубой', color: '#3b82f6' },
        { name: 'Фиолетовый', color: '#a855f7' }
    ];

    return (
        <div className="w-full border border-white/15 rounded-2xl overflow-hidden bg-black/60 shadow-2xl flex flex-col">
            {/* WORD / WORDPRESS STYLE TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#121927] border-b border-white/10 select-none">
                
                {/* Left Controls Group */}
                <div className="flex flex-wrap items-center gap-1">

                    {/* Format Selector Dropdown */}
                    <select
                        onChange={(e) => handleFormatBlock(e.target.value)}
                        defaultValue=""
                        className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-gray-200 font-semibold focus:outline-none focus:border-story-gold/50 cursor-pointer"
                    >
                        <option value="" disabled>Стиль текста...</option>
                        <option value="<p>">Обычный абзац (P)</option>
                        <option value="<h2>">Заголовок 2 (H2)</option>
                        <option value="<h3>">Заголовок 3 (H3)</option>
                        <option value="<h4>">Заголовок 4 (H4)</option>
                        <option value="<blockquote>">Цитата (Blockquote)</option>
                        <option value="callout">💡 Блок-заметка (Callout)</option>
                    </select>

                    <div className="h-5 w-px bg-white/10 mx-1" />

                    {/* Font Styles */}
                    <button
                        type="button"
                        onClick={() => exec('bold')}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Жирный (Ctrl+B)"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => exec('italic')}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Курсив (Ctrl+I)"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => exec('underline')}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Подчеркнутый (Ctrl+U)"
                    >
                        <Underline className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => exec('strikeThrough')}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Зачеркнутый"
                    >
                        <Strikethrough className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-px bg-white/10 mx-1" />

                    {/* Text Color Picker */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setColorPickerOpen(!colorPickerOpen)}
                            className="p-1.5 rounded-lg text-amber-400 hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-bold"
                            title="Цвет текста"
                        >
                            <span className="w-4 h-4 rounded-full border border-white/20 bg-amber-500 inline-block" />
                        </button>
                        {colorPickerOpen && (
                            <div className="absolute left-0 top-full mt-1.5 z-50 p-2 bg-[#1a2336] border border-white/20 rounded-xl shadow-2xl flex items-center gap-1.5 animate-fadeIn">
                                {colorPalette.map(c => (
                                    <button
                                        key={c.color}
                                        type="button"
                                        onClick={() => {
                                            exec('foreColor', c.color);
                                            setColorPickerOpen(false);
                                        }}
                                        style={{ backgroundColor: c.color }}
                                        className="w-5 h-5 rounded-full border border-white/30 hover:scale-125 transition-transform"
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-5 w-px bg-white/10 mx-1" />

                    {/* Alignments */}
                    <button
                        type="button"
                        onClick={() => exec('justifyLeft')}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="По левому краю"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => exec('justifyCenter')}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="По центру"
                    >
                        <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => exec('justifyRight')}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="По правому краю"
                    >
                        <AlignRight className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-px bg-white/10 mx-1" />

                    {/* Lists */}
                    <button
                        type="button"
                        onClick={() => exec('insertUnorderedList')}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Маркированный список"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => exec('insertOrderedList')}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Нумерованный список"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>

                    <div className="h-5 w-px bg-white/10 mx-1" />

                    {/* Inserts: Image, Link, HR */}
                    <label className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/20 cursor-pointer transition-colors flex items-center gap-1" title="Загрузить фото через Imgur">
                        <Upload className="w-4 h-4" />
                        <span className="text-[11px] font-bold">{uploading ? 'Загрузка...' : 'Фото'}</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>

                    <button
                        type="button"
                        onClick={handleInsertLink}
                        className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                        title="Вставить ссылку"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={handleInsertHr}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Разделительная линия (<hr>)"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                </div>

                {/* Right Controls Group: View Mode Switcher */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setMode('VISUAL')}
                        className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${mode === 'VISUAL' ? 'bg-story-gold text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Word Визуальный
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('CODE')}
                        className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${mode === 'CODE' ? 'bg-story-gold text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Code className="w-3.5 h-3.5" />
                        HTML Исходный
                    </button>
                </div>
            </div>

            {/* EDITOR CANVAS AREA */}
            <div className="relative flex-1">
                {mode === 'VISUAL' ? (
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        style={{ minHeight }}
                        className="w-full p-6 text-gray-100 text-sm leading-relaxed focus:outline-none overflow-y-auto max-h-[650px] prose prose-invert max-w-none focus:ring-0"
                    />
                ) : (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ minHeight }}
                        className="w-full p-6 bg-black/90 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none overflow-y-auto max-h-[650px] border-none resize-y"
                        placeholder="<h2>Заголовок...</h2>"
                    />
                )}
            </div>

            {/* Editor Footer Status Bar */}
            <div className="px-4 py-1.5 bg-[#0d131f] border-t border-white/10 text-[11px] text-gray-400 flex items-center justify-between font-mono select-none">
                <span>{mode === 'VISUAL' ? '✏️ Визуальный WYSIWYG Редактор' : '💻 Режим HTML кода'}</span>
                <span>Символов: {value ? value.length : 0}</span>
            </div>
        </div>
    );
};
