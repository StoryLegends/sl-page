
import Layout from '../components/Layout';
import { HelpCircle, Info, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ = () => {
    return (
        <Layout>
            <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-story-gold/20 blur-[100px] rounded-full -z-10" />
                    <HelpCircle className="w-20 h-20 text-story-gold mx-auto mb-6 animate-pulse-slow" />
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-story-gold via-white to-legends-blue bg-clip-text text-transparent drop-shadow-lg">
                        FAQ / ЧЗВ
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Ответы на часто задаваемые вопросы
                    </p>
                </div>

                {/* FAQ Items */}
                <div className="space-y-8">

                    {/* Question 1 */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-start gap-3">
                                <span className="text-story-gold">В:</span>
                                Как долго рассматривают заявку / Когда меня примут?
                            </h3>
                            <div className="text-gray-300 pl-8 border-l-2 border-white/10">
                                <span className="font-bold text-blue-400 mr-2">О:</span>
                                Заявки рассматриваются до 24 часов, бывают случаи, что до 48.
                            </div>
                        </div>
                    </div>

                    {/* Question 2 */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-start gap-3">
                                <span className="text-story-gold">В:</span>
                                Как понять, что меня приняли / не приняли?
                            </h3>
                            <div className="text-gray-300 pl-8 border-l-2 border-white/10">
                                <span className="font-bold text-blue-400 mr-2">О:</span>
                                После рассмотрения заявки вам напишет администратор и сообщит, что вы приняты. Если после срока рассмотрения вам не написали, то вы не приняты.
                            </div>
                        </div>
                    </div>

                    {/* Question 3 */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-start gap-3">
                                <span className="text-story-gold">В:</span>
                                Где найти айпи / моды / версию?
                            </h3>
                            <div className="text-gray-300 pl-8 border-l-2 border-white/10">
                                <span className="font-bold text-blue-400 mr-2">О:</span>
                                Вся эта информация хранится в канале <span className="text-indigo-400 font-mono bg-indigo-500/10 px-1 rounded">#инфа</span> в категории сервера в дискорд. Пожалуйста, читайте всё внимательно и весь канал. Убедитесь, что у вас есть роль <span className="text-yellow-400 font-mono bg-yellow-400/10 px-1 rounded">@SL</span> и вашу заявку приняли.
                            </div>
                        </div>
                    </div>

                    {/* Question 4 */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-start gap-3">
                                <span className="text-story-gold">В:</span>
                                Где найти мод?
                            </h3>
                            <div className="text-gray-300 pl-8 border-l-2 border-white/10">
                                <span className="font-bold text-blue-400 mr-2">О:</span>
                                Зависит какой. Если в канале <span className="text-indigo-400 font-mono bg-indigo-500/10 px-1 rounded">#инфа</span> сказано, что мод есть в сети, то вы можете найти его на популярных ресурсах по типу Modrinth / CurseForge. Приватные моды публикуются в тот же канал под лицензиями, читайте и соблюдайте их.
                            </div>
                        </div>
                    </div>

                    {/* Question 5 */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-start gap-3">
                                <span className="text-story-gold">В:</span>
                                Меня не пускает на сервер с причиной … !
                            </h3>
                            <div className="text-gray-300 pl-8 border-l-2 border-white/10">
                                <span className="font-bold text-blue-400 mr-2">О:</span>
                                Популярные причины:
                                <ul className="list-none mt-4 space-y-4">
                                    <li className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <p className="text-red-400 font-mono text-sm mb-2">You are not white-listed on this server!</p>
                                        <p>Причина говорит сама за себя, вас нет в вайт листе, возможно вы не правильно указали ник или зашли не с того ника, проверьте.</p>
                                    </li>
                                    <li className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <p className="text-red-400 font-mono text-sm mb-2">The server requires the mod “SLcompass” installed</p>
                                        <p>Вы не установили один из наших модов, без него нельзя играть. Установите и ошибка исчезнет. (Ошибка может появится при высоком пинге)</p>
                                    </li>
                                    <li className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <p className="text-red-400 font-mono text-sm mb-2">The following registry entry namespaces may be related: …</p>
                                        <p>Отсутствие каких либо модов на вашем клиенте. Под ошибкой “...” пишет название модов которых у вас нет, проверьте установили ли вы все моды из канала <span className="text-indigo-400 font-mono bg-indigo-500/10 px-1 rounded">#инфа</span>.</p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Question 6 */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-start gap-3">
                                <span className="text-story-gold">В:</span>
                                Что можно на сервере?
                            </h3>
                            <div className="text-gray-300 pl-8 border-l-2 border-white/10">
                                <span className="font-bold text-blue-400 mr-2">О:</span>
                                Читайте правила. <Link to="/rules" className="text-story-gold hover:underline inline-flex items-center gap-1">https://www.storylegends.xyz/rules <LinkIcon className="w-3 h-3" /></Link>. Если чего-то нет в правилах, напишите тех-админу проекта (lendspele_).
                            </div>
                        </div>
                    </div>

                    {/* Question 7 */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-start gap-3">
                                <span className="text-story-gold">В:</span>
                                Какие механики есть на сервере и как их использовать?
                            </h3>
                            <div className="text-gray-300 pl-8 border-l-2 border-white/10">
                                <span className="font-bold text-blue-400 mr-2">О:</span>
                                Все механики кратко описаны в <span className="text-indigo-400 font-mono bg-indigo-500/10 px-1 rounded">#инфа</span>. Если вам что-то не ясно, то вы всегда можете спросить администрацию. Крафты узнаются на сервере, но если они уже изучены, вы можете спросить игроков.
                            </div>
                        </div>
                    </div>

                    {/* Question 8 */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-start gap-3">
                                <span className="text-story-gold">В:</span>
                                Кто админ сервера / рассматривает заявки?
                            </h3>
                            <div className="text-gray-300 pl-8 border-l-2 border-white/10">
                                <span className="font-bold text-blue-400 mr-2">О:</span>
                                Весь админ состав описан на странице “О сервере” <Link to="/about" className="text-story-gold hover:underline inline-flex items-center gap-1">(https://www.storylegends.xyz/about) <LinkIcon className="w-3 h-3" /></Link>.
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Note */}
                <div className="mt-16 p-4 md:p-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm text-center">
                    <Info className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <p className="text-gray-300">
                        Не нашли ответ на свой вопрос? Обратитесь к администрации в Discord сервере.
                    </p>
                </div>

            </div>
        </Layout>
    );
};

export default FAQ;
