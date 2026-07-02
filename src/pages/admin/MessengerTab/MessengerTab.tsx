import React, { useEffect, useState, useRef } from 'react';
import { Input, Button, Avatar, Tag, Spin, Typography, Modal, Tooltip, message } from 'antd';
import {
    SendOutlined,
    SearchOutlined,
    PictureOutlined,
    EditOutlined,
    DeleteOutlined,
    MessageOutlined,
    DiscordOutlined,
    LinkOutlined,
    SafetyOutlined,
    UploadOutlined,
    BoldOutlined,
    ItalicOutlined,
    CodeOutlined,
    FieldBinaryOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { messengerApi, type BotMessage, type ConversationItem } from '../../../api/messenger';
import { useAdminWebSocket } from '../../../hooks/useAdminWebSocket';
import PlayerDossier from '../shared/PlayerDossier';

const { Title, Text, Paragraph } = Typography;

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '✅', '❌'];

const RenderMarkdown: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;
    
    const lines = content.split('\n');
    return (
        <span className="whitespace-pre-line leading-relaxed">
            {lines.map((line, idx) => {
                let parts: (string | React.ReactElement)[] = [line];
                
                // Bold **
                parts = parts.flatMap(p => typeof p === 'string' ? p.split(/(\*\*[^*]+\*\*)/g).map((s, i) => s.startsWith('**') && s.endsWith('**') ? <strong key={`b-${i}`} className="font-bold text-amber-200">{s.slice(2, -2)}</strong> : s) : [p]);
                
                // Inline code `
                parts = parts.flatMap(p => typeof p === 'string' ? p.split(/(`[^`]+`)/g).map((s, i) => s.startsWith('`') && s.endsWith('`') ? <code key={`c-${i}`} className="bg-white/10 text-sky-300 px-1 py-0.5 rounded text-[12px] font-mono">{s.slice(1, -1)}</code> : s) : [p]);

                // Italic *
                parts = parts.flatMap(p => typeof p === 'string' ? p.split(/(\*[^*]+\*)/g).map((s, i) => s.startsWith('*') && s.endsWith('*') ? <em key={`i-${i}`} className="italic text-gray-200">{s.slice(1, -1)}</em> : s) : [p]);

                return (
                    <React.Fragment key={idx}>
                        {parts}
                        {idx < lines.length - 1 && <br />}
                    </React.Fragment>
                );
            })}
        </span>
    );
};

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
};

const MessengerTab: React.FC = () => {
    const isMobile = useIsMobile();
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [activeConversations, setActiveConversations] = useState<ConversationItem[]>([]);
    const [uncontactedPlayers, setUncontactedPlayers] = useState<ConversationItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedUserItem, setSelectedUserItem] = useState<ConversationItem | null>(null);
    const [messagesList, setMessagesList] = useState<BotMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Input state
    const [textInput, setTextInput] = useState('');
    const [mediaInput, setMediaInput] = useState('');
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [showMediaInput, setShowMediaInput] = useState(false);
    const [sending, setSending] = useState(false);

    // Edit Modal state
    const [editingMsg, setEditingMsg] = useState<BotMessage | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editMediaUrl, setEditMediaUrl] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Dossier state
    const [dossierUserId, setDossierUserId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<any>(null);
    const selectedUserIdRef = useRef<number | null>(null);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        selectedUserIdRef.current = selectedUserItem?.user.id || null;
    }, [selectedUserItem?.user.id]);

    const loadConversations = async (autoSelectUserId?: number, isSilent: boolean = false) => {
        if (!isSilent) setLoadingConversations(true);
        try {
            const res = await messengerApi.getConversations();
            setActiveConversations(res.activeConversations || []);
            setUncontactedPlayers(res.uncontactedPlayers || []);

            // Only change selection if we explicitly need to (initial load or query param redirect)
            if (autoSelectUserId) {
                const foundInActive = res.activeConversations.find(c => c.user.id === autoSelectUserId);
                const foundInUncontacted = res.uncontactedPlayers.find(c => c.user.id === autoSelectUserId);
                if (foundInActive) setSelectedUserItem(foundInActive);
                else if (foundInUncontacted) setSelectedUserItem(foundInUncontacted);
            } else if (!selectedUserIdRef.current) {
                // If nothing was selected yet, default to first active
                if (res.activeConversations.length > 0) {
                    setSelectedUserItem(res.activeConversations[0]);
                } else if (res.uncontactedPlayers.length > 0) {
                    setSelectedUserItem(res.uncontactedPlayers[0]);
                }
            }
        } catch (err) {
            console.error('Failed to load messenger conversations:', err);
            if (!isSilent) message.error('Не удалось загрузить список диалогов');
        } finally {
            if (!isSilent) setLoadingConversations(false);
        }
    };

    const loadMessages = async (userId: number) => {
        setLoadingMessages(true);
        try {
            const history = await messengerApi.getMessages(userId);
            setMessagesList(history);
        } catch (err) {
            console.error('Failed to load messages history:', err);
            message.error('Не удалось загрузить историю сообщений');
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlUserId = params.get('userId');
        if (urlUserId) {
            loadConversations(Number(urlUserId));
        } else {
            loadConversations();
        }
    }, []);

    useEffect(() => {
        if (selectedUserItem) {
            isInitialLoadRef.current = true;
            loadMessages(selectedUserItem.user.id);
        }
    }, [selectedUserItem?.user.id]);

    useEffect(() => {
        if (isInitialLoadRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            isInitialLoadRef.current = false;
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messagesList]);

    useAdminWebSocket({
        '/topic/admin/messenger': (data: any) => {
            if (data.deletedMessageId) {
                setMessagesList(prev => prev.filter(m => Number(m.id) !== Number(data.deletedMessageId)));
            } else if (data.id && data.recipientUserId) {
                if (selectedUserIdRef.current && Number(data.recipientUserId) === Number(selectedUserIdRef.current)) {
                    setMessagesList(prev => {
                        const exists = prev.some(m => Number(m.id) === Number(data.id));
                        if (exists) {
                            return prev.map(m => Number(m.id) === Number(data.id) ? data : m);
                        }
                        return [...prev, data];
                    });
                }
            }
            loadConversations(undefined, true);
        }
    });

    const handleFileUpload = async (file: File) => {
        setUploadingMedia(true);
        try {
            const res = await messengerApi.uploadFile(file);
            setMediaInput(res.url);
            setShowMediaInput(true);
            message.success('Файл успешно загружен');
        } catch (err: any) {
            console.error('Failed to upload file:', err);
            message.error('Не удалось загрузить файл');
        } finally {
            setUploadingMedia(false);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            const file = e.clipboardData.files[0];
            if (file.type.startsWith('image/')) {
                e.preventDefault();
                handleFileUpload(file);
            }
        }
    };

    const insertFormatting = (prefix: string, suffix: string) => {
        const textarea = textAreaRef.current?.resizableTextArea?.textArea || textAreaRef.current;
        if (!textarea) {
            setTextInput(prev => prev + prefix + suffix);
            return;
        }
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const selected = textInput.substring(start, end);
        const replacement = prefix + (selected || 'текст') + suffix;
        const newText = textInput.substring(0, start) + replacement + textInput.substring(end);
        setTextInput(newText);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 5));
        }, 50);
    };

    const handleSendMessage = async () => {
        if (!selectedUserItem) return;
        if (!textInput.trim() && !mediaInput.trim()) {
            message.warning('Введите текст сообщения или прикрепите медиа');
            return;
        }

        setSending(true);
        try {
            const newMsg = await messengerApi.sendMessage(
                selectedUserItem.user.id,
                textInput.trim(),
                mediaInput.trim() || undefined
            );
            setTextInput('');
            setMediaInput('');
            setShowMediaInput(false);
            setMessagesList(prev => {
                const exists = prev.some(m => Number(m.id) === Number(newMsg.id));
                if (exists) return prev;
                return [...prev, newMsg];
            });
            
            loadConversations(undefined, true);
        } catch (err: any) {
            console.error('Failed to send message:', err);
            message.error(err.response?.data?.message || 'Не удалось отправить сообщение');
        } finally {
            setSending(false);
        }
    };

    const handleToggleReaction = async (msgId: number, emoji: string) => {
        try {
            const updated = await messengerApi.toggleReaction(msgId, emoji);
            setMessagesList(prev => prev.map(m => m.id === updated.id ? updated : m));
        } catch (err) {
            console.error('Failed to toggle reaction:', err);
        }
    };

    const handleOpenEdit = (msg: BotMessage) => {
        setEditingMsg(msg);
        setEditContent(msg.content || '');
        setEditMediaUrl(msg.mediaUrl || '');
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingMsg) return;
        setUpdating(true);
        try {
            const updated = await messengerApi.editMessage(
                editingMsg.id,
                editContent.trim(),
                editMediaUrl.trim() || undefined
            );
            setMessagesList(prev => prev.map(m => m.id === updated.id ? updated : m));
            message.success('Сообщение отредактировано');
            setIsEditModalOpen(false);
            loadConversations(undefined, true);
        } catch (err: any) {
            console.error('Failed to edit message:', err);
            message.error(err.response?.data?.message || 'Не удалось отредактировать сообщение');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteMsg = (msgId: number) => {
        Modal.confirm({
            title: 'Удалить сообщение?',
            content: 'Сообщение будет удалено из базы и из личных сообщений пользователя в Discord.',
            okText: 'Удалить',
            cancelText: 'Отмена',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await messengerApi.deleteMessage(msgId);
                    setMessagesList(prev => prev.filter(m => m.id !== msgId));
                    message.success('Сообщение удалено');
                    if (selectedUserItem) loadConversations(selectedUserItem.user.id, true);
                } catch (err: any) {
                    console.error('Failed to delete message:', err);
                    message.error('Не удалось удалить сообщение');
                }
            }
        });
    };

    const filteredActive = activeConversations.filter(c =>
        c.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.user.minecraftNickname && c.user.minecraftNickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.user.discordNickname && c.user.discordNickname.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredUncontacted = uncontactedPlayers.filter(c =>
        c.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.user.minecraftNickname && c.user.minecraftNickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.user.discordNickname && c.user.discordNickname.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://slbackend-7a8596651d0c.herokuapp.com' : 'http://localhost:8080');

    const resolveMediaUrl = (url: string): string => {
        if (!url) return url;
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
        // Relative path from backend — prepend API base
        return `${API_URL}/api/files/${url}`;
    };

    const isImage = (url: string) => {
        const resolved = url.toLowerCase();
        return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(resolved) 
            || resolved.startsWith('data:image/')
            || resolved.includes('/api/files/')
            || resolved.startsWith('messenger/');
    };

    const parseReactions = (reactionsStr?: string | null): string[] => {
        if (!reactionsStr) return [];
        return reactionsStr.split(',').filter(Boolean);
    };

    return (
        <div className={`h-[calc(100vh-140px)] flex bg-[#0d1322] ${isMobile ? 'rounded-xl' : 'rounded-2xl'} overflow-hidden border border-white/5 shadow-2xl animate-fadeIn`}>
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                        e.target.value = '';
                    }
                }}
            />

            {/* Left Column — Dialogs List (hidden on mobile when chat is open) */}
            <div className={`${isMobile ? (mobileShowChat ? 'hidden' : 'w-full') : 'w-80'} border-r border-white/5 flex flex-col bg-[#111827]`}>
                {/* Search Header */}
                <div className="p-3 border-b border-white/5">
                    <Input
                        placeholder="Поиск собеседника..."
                        prefix={<SearchOutlined className="text-gray-500" />}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-black/30 border-white/10 text-white rounded-xl text-xs placeholder:text-gray-500"
                        allowClear
                    />
                </div>

                {/* Conversations scroll area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                    {loadingConversations ? (
                        <div className="py-12 text-center"><Spin /></div>
                    ) : (
                        <>
                            {/* Active Conversations section */}
                            {filteredActive.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-[10px] font-bold tracking-wider uppercase text-sky-400 bg-sky-950/20">
                                        Активные чаты ({filteredActive.length})
                                    </div>
                                    {filteredActive.map(item => {
                                        const isSelected = selectedUserItem?.user.id === item.user.id;
                                        return (
                                            <div
                                                key={item.user.id}
                                                onClick={() => { setSelectedUserItem(item); if (isMobile) setMobileShowChat(true); }}
                                                className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-sky-600/20 border-l-4 border-sky-400' : 'hover:bg-white/5'}`}
                                            >
                                                <div className="relative shrink-0">
                                                    <Avatar
                                                        src={item.user.avatarUrl}
                                                        size={40}
                                                        className="border border-white/10 bg-black/40"
                                                    >
                                                        {item.user.username.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    {item.user.banned && (
                                                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] px-1 rounded-full font-bold">BAN</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <Text style={{ color: '#fff' }} className="font-bold text-xs truncate">
                                                            {item.user.username}
                                                        </Text>
                                                        {item.lastMessageTime && (
                                                            <span className="text-[10px] text-gray-500 shrink-0">
                                                                {new Date(item.lastMessageTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
                                                        {item.user.minecraftNickname && (
                                                            <span className="truncate text-gray-500 font-mono">🎮 {item.user.minecraftNickname}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate mt-1 m-0">
                                                        {item.lastMessage || <span className="italic opacity-50">Нет сообщений</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Uncontacted Players section */}
                            {filteredUncontacted.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-[10px] font-bold tracking-wider uppercase text-gray-400 bg-black/20">
                                        Все игроки ({filteredUncontacted.length})
                                    </div>
                                    {filteredUncontacted.map(item => {
                                        const isSelected = selectedUserItem?.user.id === item.user.id;
                                        return (
                                            <div
                                                key={item.user.id}
                                                onClick={() => { setSelectedUserItem(item); if (isMobile) setMobileShowChat(true); }}
                                                className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-sky-600/20 border-l-4 border-sky-400' : 'hover:bg-white/5'}`}
                                            >
                                                <Avatar
                                                    src={item.user.avatarUrl}
                                                    size={36}
                                                    className="border border-white/10 bg-black/40 shrink-0"
                                                >
                                                    {item.user.username.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <Text style={{ color: '#fff' }} className="font-semibold text-xs truncate block">
                                                        {item.user.username}
                                                    </Text>
                                                    <div className="flex items-center gap-1 text-[11px] text-gray-400 truncate">
                                                        {item.user.discordNickname ? (
                                                            <span className="truncate text-indigo-300">💬 {item.user.discordNickname}</span>
                                                        ) : (
                                                            <span className="truncate text-gray-500 font-mono">🎮 {item.user.minecraftNickname || '—'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {filteredActive.length === 0 && filteredUncontacted.length === 0 && (
                                <div className="p-8 text-center text-gray-500 text-xs">Игроки не найдены</div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Right Column — Chat Window (hidden on mobile when list is shown) */}
            <div className={`${isMobile && !mobileShowChat ? 'hidden' : ''} flex-1 flex flex-col bg-[#0f172a]/80`}>
                {selectedUserItem ? (
                    <>
                        {/* Chat Header */}
                        <div className={`${isMobile ? 'p-2.5 px-3' : 'p-3.5 px-6'} border-b border-white/5 bg-[#1e293b]/60 flex items-center justify-between`}>
                            <div className="flex items-center gap-2 md:gap-3">
                                {isMobile && (
                                    <Button
                                        type="text"
                                        icon={<ArrowLeftOutlined />}
                                        onClick={() => setMobileShowChat(false)}
                                        className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center p-0"
                                    />
                                )}
                                <Avatar
                                    src={selectedUserItem.user.avatarUrl}
                                    size={42}
                                    className="border border-sky-500/30 shadow-lg cursor-pointer"
                                    onClick={() => setDossierUserId(selectedUserItem.user.id)}
                                >
                                    {selectedUserItem.user.username.charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Title
                                            level={5}
                                            style={{ color: '#fff', margin: 0 }}
                                            className="cursor-pointer hover:text-sky-400 transition-colors"
                                            onClick={() => setDossierUserId(selectedUserItem.user.id)}
                                        >
                                            {selectedUserItem.user.username}
                                        </Title>
                                        <Tag color={selectedUserItem.user.role === 'ROLE_ADMIN' ? 'gold' : selectedUserItem.user.role === 'ROLE_MODERATOR' ? 'cyan' : 'blue'} className="text-[10px]">
                                            {selectedUserItem.user.role}
                                        </Tag>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                        <span>🎮 MC: <span className="text-gray-200 font-mono">{selectedUserItem.user.minecraftNickname || '—'}</span></span>
                                        <span>💬 Discord: <span className="text-indigo-300">{selectedUserItem.user.discordNickname || '—'}</span></span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="primary"
                                ghost
                                size="small"
                                icon={<SafetyOutlined />}
                                onClick={() => setDossierUserId(selectedUserItem.user.id)}
                                style={{ borderColor: '#00BFFF', color: '#00BFFF', borderRadius: 8 }}
                            >
                                Досье
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {loadingMessages ? (
                                <div className="py-20 text-center"><Spin tip="Загрузка истории..." /></div>
                            ) : messagesList.length === 0 ? (
                                <div className="py-20 text-center text-gray-500 space-y-2">
                                    <MessageOutlined className="text-4xl text-gray-600" />
                                    <p className="text-sm">История сообщений пуста. Отправьте первое сообщение игроку от имени бота!</p>
                                </div>
                            ) : (
                                messagesList.map(msg => {
                                    const isFromPlayer = Boolean(msg.isFromPlayer || (msg as any).fromPlayer);
                                    const reactionsList = parseReactions(msg.reactions);

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col space-y-1 group ${isFromPlayer ? 'items-start' : 'items-end'}`}
                                        >
                                            <div className={`flex items-center gap-2 max-w-2xl ${isFromPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Actions Menu */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    {!isFromPlayer && (
                                                        <>
                                                            <Tooltip title="Редактировать">
                                                                <Button
                                                                    type="text"
                                                                    size="small"
                                                                    icon={<EditOutlined className="text-gray-400 hover:text-sky-400" />}
                                                                    onClick={() => handleOpenEdit(msg)}
                                                                />
                                                            </Tooltip>
                                                            <Tooltip title="Удалить">
                                                                <Button
                                                                    type="text"
                                                                    size="small"
                                                                    icon={<DeleteOutlined className="text-gray-400 hover:text-red-400" />}
                                                                    onClick={() => handleDeleteMsg(msg.id)}
                                                                />
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Bubble */}
                                                <div
                                                    className={
                                                        isFromPlayer
                                                            ? "bg-white/10 border border-white/10 text-white p-3.5 rounded-2xl rounded-tl-none shadow-lg relative"
                                                            : "bg-sky-600/20 border border-sky-500/30 text-white p-3.5 rounded-2xl rounded-tr-none shadow-lg shadow-sky-950/20 relative"
                                                    }
                                                >
                                                    <div className={`flex items-center justify-between gap-4 mb-1 border-b pb-1 text-[11px] ${isFromPlayer ? 'border-white/10 text-emerald-400' : 'border-sky-500/20 text-sky-300'}`}>
                                                        <span className="font-bold flex items-center gap-1">
                                                            {isFromPlayer ? (
                                                                <>Игрок ({selectedUserItem?.user.username})</>
                                                            ) : (
                                                                <><DiscordOutlined /> Bot ({msg.senderAdminName})</>
                                                            )}
                                                        </span>
                                                        <span className="text-gray-400">
                                                            {new Date(msg.createdAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                            {msg.isEdited && <span className="ml-1 italic text-gray-500">(изм.)</span>}
                                                        </span>
                                                    </div>

                                                    {msg.content && (
                                                        <Paragraph className="text-white text-sm leading-relaxed m-0">
                                                            <RenderMarkdown content={msg.content} />
                                                        </Paragraph>
                                                    )}

                                                    {msg.mediaUrl && (() => {
                                                        const resolvedUrl = resolveMediaUrl(msg.mediaUrl);
                                                        return (
                                                        <div className="mt-2 pt-2 border-t border-white/10">
                                                            {isImage(msg.mediaUrl) ? (
                                                                <img
                                                                    src={resolvedUrl}
                                                                    alt="Media attachment"
                                                                    className="max-h-60 rounded-xl object-contain border border-white/10 bg-black/40"
                                                                />
                                                            ) : (
                                                                <a
                                                                    href={resolvedUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-sky-400 hover:underline flex items-center gap-1 text-xs"
                                                                >
                                                                    <LinkOutlined /> {msg.mediaUrl}
                                                                </a>
                                                            )}
                                                        </div>
                                                        );
                                                    })()}

                                                    {/* Displayed Reactions */}
                                                    {reactionsList.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-white/5">
                                                            {Array.from(new Set(reactionsList)).map(emoji => {
                                                                const count = reactionsList.filter(e => e === emoji).length;
                                                                return (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => handleToggleReaction(msg.id, emoji)}
                                                                        className="bg-black/30 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors"
                                                                    >
                                                                        <span>{emoji}</span>
                                                                        {count > 1 && <span className="text-[10px] font-bold text-sky-300">{count}</span>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Quick Emoji Reaction Bar (on Hover) */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-3 right-2 bg-slate-900 border border-white/15 px-2 py-0.5 rounded-full shadow-xl flex items-center gap-1 z-10">
                                                        {QUICK_EMOJIS.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                                                className="hover:scale-125 transition-transform text-xs p-0.5"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Footer */}
                        <div className={`${isMobile ? 'p-2' : 'p-4'} border-t border-white/5 bg-black/10 space-y-2`}>
                            {/* Formatting Toolbar */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1">
                                    <Tooltip title="Жирный (**текст**)">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<BoldOutlined className="text-gray-400 hover:text-white" />}
                                            onClick={() => insertFormatting('**', '**')}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Курсив (*текст*)">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ItalicOutlined className="text-gray-400 hover:text-white" />}
                                            onClick={() => insertFormatting('*', '*')}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Код (`код`)">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CodeOutlined className="text-gray-400 hover:text-white" />}
                                            onClick={() => insertFormatting('`', '`')}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Цитата (> текст)">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<FieldBinaryOutlined className="text-gray-400 hover:text-white" />}
                                            onClick={() => insertFormatting('> ', '')}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Ссылка ([текст](url))">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<LinkOutlined className="text-gray-400 hover:text-white" />}
                                            onClick={() => insertFormatting('[текст](', ')')}
                                        />
                                    </Tooltip>
                                </div>
                                <span className="text-[11px] text-gray-500 font-mono">Markdown поддерживается</span>
                            </div>

                            {showMediaInput && (
                                <div className="flex items-center gap-3 bg-black/30 p-2.5 rounded-xl border border-white/10">
                                    {mediaInput && isImage(mediaInput) && (
                                        <img 
                                            src={resolveMediaUrl(mediaInput)} 
                                            alt="Preview" 
                                            className="h-12 w-12 rounded-lg object-cover border border-white/10 shrink-0"
                                        />
                                    )}
                                    {!mediaInput || !isImage(mediaInput) ? (
                                        <PictureOutlined className="text-sky-400 shrink-0" />
                                    ) : null}
                                    <Input
                                        placeholder="Ссылка или загруженный файл (https://...)"
                                        value={mediaInput}
                                        onChange={(e) => setMediaInput(e.target.value)}
                                        className="bg-transparent border-0 text-white text-xs placeholder:text-gray-500 focus:shadow-none"
                                    />
                                    <Button
                                        type="text"
                                        size="small"
                                        className="text-gray-400 hover:text-white shrink-0"
                                        onClick={() => { setShowMediaInput(false); setMediaInput(''); }}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-start gap-2">
                                <Tooltip title="Загрузить файл / картинку с компьютера">
                                    <Button
                                        type={showMediaInput || mediaInput ? "primary" : "default"}
                                        ghost={!showMediaInput && !mediaInput}
                                        icon={uploadingMedia ? <Spin size="small" /> : <UploadOutlined />}
                                        loading={uploadingMedia}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-xl h-10 w-10 flex items-center justify-center border-white/10 mt-1"
                                    />
                                </Tooltip>

                                <div className="flex-1 relative">
                                    <Input.TextArea
                                        ref={textAreaRef}
                                        rows={isMobile ? 2 : 3}
                                        autoSize={{ minRows: isMobile ? 2 : 3, maxRows: isMobile ? 4 : 8 }}
                                        placeholder={isMobile ? 'Сообщение...' : `Написать сообщение пользователю ${selectedUserItem.user.username} в Discord...`}
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        onPaste={handlePaste}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="bg-black/30 border-white/10 text-white rounded-xl placeholder:text-gray-500 p-3 leading-relaxed"
                                    />
                                </div>

                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    loading={sending}
                                    onClick={handleSendMessage}
                                    style={{ backgroundColor: '#00BFFF', borderColor: '#00BFFF' }}
                                    className={`rounded-xl font-bold shadow-lg shadow-sky-500/20 mt-1 ${isMobile ? 'h-10 w-10 p-0' : 'h-12 px-6'}`}
                                >
                                    {!isMobile && 'Отправить'}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500 space-y-3">
                        <MessageOutlined className="text-5xl text-gray-600" />
                        <Title level={4} style={{ color: '#aaa', margin: 0 }}>Выберите игрока для начала общения</Title>
                        <p className="text-sm max-w-md text-center">Выберите собеседника из списка слева, чтобы отправить ему сообщение в Discord от имени официального бота сервера.</p>
                    </div>
                )}
            </div>

            {/* Modal: Edit Message */}
            <Modal
                title="Редактировать сообщение"
                open={isEditModalOpen}
                onOk={handleSaveEdit}
                confirmLoading={updating}
                onCancel={() => setIsEditModalOpen(false)}
                okText="Сохранить"
                cancelText="Отмена"
                className="custom-modal"
            >
                <div className="space-y-4 pt-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Текст сообщения (Markdown):</label>
                        <Input.TextArea
                            rows={4}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-black/30 border-white/10 text-white rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Ссылка на медиа / файл:</label>
                        <Input
                            value={editMediaUrl}
                            onChange={(e) => setEditMediaUrl(e.target.value)}
                            className="bg-black/30 border-white/10 text-white rounded-xl"
                        />
                    </div>
                </div>
            </Modal>

            {/* Drawer Dossier */}
            {dossierUserId && (
                <PlayerDossier
                    userId={dossierUserId}
                    visible={Boolean(dossierUserId)}
                    onClose={() => setDossierUserId(null)}
                />
            )}
        </div>
    );
};

export default MessengerTab;
