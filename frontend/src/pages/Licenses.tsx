import Layout from '../components/Layout';
import SEO from '../components/SEO';

const Licenses = () => {
    return (
        <Layout>
            <SEO
                title="Лицензии"
                description="Информация о лицензиях на моды SLcamera, SLbase и авторском контенте сервера StoryLegends."
            />
            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-12">Licenses</h1>

                <div className="space-y-16">
                    {/* SLcamera License */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-3xl font-bold text-white mb-2">ARR License – SLcamera</h2>
                        <p className="text-gray-400 mb-6 text-sm">
                            Copyright © 2025-2026 StoryLegends<br />
                            Все права защищены (All Rights Reserved).
                        </p>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">1. Использование</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Данный мод разрешён к использованию только на сервере StoryLegends.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">2. Запрещается</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed ml-2">
                                    <li>Использовать мод на других серверах.</li>
                                    <li>Распространять мод в любом виде (включая загрузку на сторонние сайты).</li>
                                    <li>Модифицировать, декомпилировать или встраивать части мода в другие проекты.</li>
                                    <li>Использовать мод в коммерческих целях без разрешения автора.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">3. Исключительные права</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Все права на данный мод принадлежат владельцу сервера StoryLegends (LendSpele). Любое несанкционированное использование приведёт к нарушению авторских прав.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/10 mt-6">
                                <p className="text-gray-400 text-sm">
                                    По любым вопросам пишите в discord.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* SLbase License */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        <h2 className="text-3xl font-bold text-white mb-2">ARR License – SLbase</h2>
                        <p className="text-gray-400 mb-6 text-sm">
                            Copyright © 2025-2026 StoryLegends<br />
                            Все права защищены (All Rights Reserved).
                        </p>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">1. Использование</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Данный мод разрешён к использованию только на сервере StoryLegends.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">2. Запрещается</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed ml-2">
                                    <li>Использовать мод на других серверах.</li>
                                    <li>Распространять мод в любом виде (включая загрузку на сторонние сайты).</li>
                                    <li>Модифицировать, декомпилировать или встраивать части мода в другие проекты.</li>
                                    <li>Использовать мод в коммерческих целях без разрешения автора.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">3. Исключительные права</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Все права на данный мод принадлежат владельцу сервера StoryLegends (LendSpele). Любое несанкционированное использование приведёт к нарушению авторских прав.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/10 mt-6">
                                <p className="text-gray-400 text-sm">
                                    По любым вопросам пишите в discord.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </Layout>
    );
};

export default Licenses;
