import { useEffect, useState } from 'react';
import { usersApi, type User } from '../api';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { Users, Search, X, MessageSquare, Gamepad2, Crown } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';


const PlayersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await usersApi.getAll();
            setUsers(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users
        .filter(u =>
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.minecraftNickname?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const aIsAdmin = a.role === 'ROLE_ADMIN' || a.role === 'ROLE_MODERATOR';
            const bIsAdmin = b.role === 'ROLE_ADMIN' || b.role === 'ROLE_MODERATOR';

            // Admins first
            if (aIsAdmin && !bIsAdmin) return -1;
            if (!bIsAdmin && aIsAdmin) return 1;

            // Then alphabetical by username
            return a.username.localeCompare(b.username);
        });

    return (
        <Layout>
            <SEO title="Игроки" description="Список игроков сервера" />
            <div className="min-h-[80vh] pt-20 pb-8 px-4 text-left">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shadow-lg shadow-blue-900/20">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold font-minecraft text-white">Список Игроков</h1>
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Поиск..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-story-gold/50 focus:bg-white/10 transition-colors text-white placeholder-gray-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-story-gold"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-left">
                            {filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setShowModal(true);
                                    }}
                                    className={`
                                        bg-black/40 border rounded-2xl p-6 backdrop-blur-md transition-all group relative overflow-hidden cursor-pointer active:scale-[0.98]
                                        ${(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MODERATOR')
                                            ? 'border-story-gold/30 shadow-[0_0_30px_rgba(255,191,0,0.1)] hover:shadow-[0_0_40px_rgba(255,191,0,0.2)] hover:border-story-gold/50'
                                            : 'border-white/10 hover:border-story-gold/30 hover:bg-white/5'}
                                    `}
                                >
                                    {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MODERATOR') ? (
                                        <>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-story-gold to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <Crown className="absolute -right-4 -bottom-4 w-32 h-32 text-story-gold/10 -rotate-12 pointer-events-none group-hover:text-story-gold/[0.15] group-hover:scale-110 transition-all duration-500" />
                                        </>
                                    ) : (
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-story-gold to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
                                    )}

                                    <div className="flex items-center gap-4 mb-4">
                                        <UserAvatar
                                            avatarUrl={user.avatarUrl}
                                            username={user.username}
                                            size="lg"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5 min-w-0 relative z-10">
                                                <h3 className="font-bold text-white text-lg truncate leading-none">{user.username}</h3>
                                                {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MODERATOR') && (
                                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border whitespace-nowrap bg-red-500/20 text-red-300 border-red-500/30">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 items-center">
                                                {user.badges && user.badges.map(badge => (
                                                    <div key={badge.id} className="group/badge relative flex items-center justify-center">
                                                        <div
                                                            className="w-7 h-7 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 cursor-help"
                                                            style={{ color: badge.color }}
                                                        >
                                                            <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 [&>svg]:max-w-full [&>svg]:max-h-full" dangerouslySetInnerHTML={{ __html: badge.svgIcon }} />
                                                        </div>
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0a0a0a] border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl">
                                                            {badge.name}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-[#0a0a0a]" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-gray-400">
                                            <span>Minecraft:</span>
                                            <span className="text-gray-200 font-mono">{user.minecraftNickname || '-'}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                            <span>Discord:</span>
                                            <span className="text-gray-200 font-mono">{user.discordNickname || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bio Modal */}
            {showModal && selectedUser && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Image/Background */}
                        <div className="h-32 bg-gradient-to-br from-story-gold/20 via-blue-900/40 to-black border-b border-white/5" />

                        {/* Content */}
                        <div className="px-8 pb-8 -mt-12 text-left">
                            <div className="flex justify-between items-end mb-6">
                                <UserAvatar
                                    avatarUrl={selectedUser.avatarUrl}
                                    username={selectedUser.username}
                                    size="xl"
                                />
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 text-gray-400 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-3xl font-bold text-white mb-3">
                                    {selectedUser.username}
                                </h3>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${(selectedUser.role === 'ROLE_ADMIN' || selectedUser.role === 'ROLE_MODERATOR') ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                        {(selectedUser.role === 'ROLE_ADMIN' || selectedUser.role === 'ROLE_MODERATOR') ? 'Admin' : 'Player'}
                                    </span>
                                    {selectedUser.badges && selectedUser.badges.map(badge => (
                                        <div
                                            key={badge.id}
                                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1.5 border"
                                            style={{
                                                backgroundColor: `${badge.color}15`,
                                                color: badge.color,
                                                borderColor: `${badge.color}30`
                                            }}
                                        >
                                            <div className="w-4 h-4 badge-icon" dangerouslySetInnerHTML={{ __html: badge.svgIcon }} />
                                            {badge.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Gamepad2 className="w-4 h-4" />
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-left">Minecraft</span>
                                        </div>
                                        <p className="text-white font-medium truncate text-left">{selectedUser.minecraftNickname || '—'}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <MessageSquare className="w-4 h-4" />
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-left">Discord</span>
                                        </div>
                                        <p className="text-white font-medium truncate text-left">{selectedUser.discordNickname || '—'}</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 relative">
                                    <div className="absolute top-4 left-6 w-1 h-4 bg-story-gold rounded-full" />
                                    <span className="text-[10px] text-story-gold uppercase font-bold tracking-widest block mb-4 px-2 text-left">Биография</span>
                                    <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        <p className="text-gray-300 leading-relaxed text-left whitespace-pre-wrap">
                                            {selectedUser.bio || 'Этот игрок еще не рассказал о себе.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default PlayersPage;
