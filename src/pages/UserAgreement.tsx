import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';

const UserAgreement = () => {
    return (
        <Layout>
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 font-minecraft text-center">
                    Пользовательское соглашение
                </h1>

                <GlassCard className="p-8 text-gray-200">
                    <div className="space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Общие положения</h2>
                            <p>
                                Настоящее Пользовательское соглашение регулирует отношения между администрацией сайта StoryLegends и пользователем. Сайт является исключительно информационным ресурсом.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Заявка и Правила сервера</h2>
                            <p>
                                Подача заявки на вступление в сервер StoryLegends осуществляется через сторонний сервис (Google Forms).
                            </p>
                            <p className="mt-2 font-bold">
                                При подаче заявки вы автоматически соглашаетесь с правилами игрового сервера!
                            </p>
                            <p className="mt-1">
                                Наличие аккаунта в Discord и присутствие на Discord-сервере проекта является обязательным условием для рассмотрения заявки.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Использование сайта</h2>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Пользователь имеет право просматривать материалы сайта в ознакомительных целях.</li>
                                <li>Копирование материалов сайта разрешено только с указанием активной ссылки на источник.</li>
                                <li>Запрещено использовать сайт для распространения вредоносного ПО или нарушения законодательства.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Отказ от ответственности</h2>
                            <p>
                                Администрация не несет ответственности за любой ущерб, возникший вследствие использования данного сайта. Материалы предоставляются "как есть".
                            </p>
                            <p className="mt-2">
                                StoryLegends не является официальным продуктом Minecraft. Мы не связаны с Mojang Studios.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Изменение условий</h2>
                            <p>
                                Администрация оставляет за собой право изменять условия данного соглашения в любое время без предварительного уведомления.
                            </p>
                        </section>
                    </div>
                </GlassCard>
            </div>
        </Layout>
    );
};

export default UserAgreement;
