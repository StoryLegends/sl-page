import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';

const PrivacyPolicy = () => {
    return (
        <Layout>
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 font-minecraft text-center">
                    Политика конфиденциальности
                </h1>

                <GlassCard className="p-8 text-gray-200">
                    <div className="space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Общие положения</h2>
                            <p>
                                Данный сайт является информационным ресурсом игрового сервера StoryLegends. Мы не собираем персональные данные непосредственно на сайте (регистрация отсутствует).
                            </p>
                            <p className="mt-2">
                                Однако, для доступа к игровому серверу пользователи добровольно заполняют <strong>Заявку</strong> (через Google Forms). В рамках заявки мы собираем следующие данные:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Никнейм в Minecraft (для добавления в WhiteList)</li>
                                <li>Имя и возраст (для статистики и модерации)</li>
                                <li>Discord тег (для связи и выдачи ролей)</li>
                                <li>Информацию о планах на игру и создании контента</li>
                                <li>Ответы на вопросы анкеты (для оценки адекватности)</li>
                            </ul>
                            <p className="mt-2">
                                Эти данные используются исключительно администрацией для рассмотрения заявки и управления доступом к серверу.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Использование файлов Cookie</h2>
                            <p>
                                Мы используем файлы cookie исключительно для обеспечения корректной работы сайта и анализа посещаемости.
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>
                                    <strong className="text-white">Технические cookie:</strong> Используются для сохранения вашего согласия с использованием cookie (чтобы не показывать баннер повторно).
                                </li>
                                <li>
                                    <strong className="text-white">Google Analytics:</strong> Используются для сбора анонимной статистики посещаемости, чтобы мы могли улучшать наш сайт. Эти данные не позволяют идентифицировать вас лично.
                                </li>
                                <li>
                                    <strong className="text-white">YouTube:</strong> На сайте могут быть встроены видео с YouTube. Google может использовать cookie для отслеживания просмотров и персонализации.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Сторонние сервисы</h2>
                            <p>
                                На сайте используются сторонние сервисы (Google Analytics, YouTube), которые могут собирать обезличенные данные в соответствии с их собственными политиками конфиденциальности. Мы не несем ответственности за данные, собираемые этими платформами.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Отказ от ответственности (Mojang)</h2>
                            <p>
                                StoryLegends не является официальным продуктом Minecraft. Мы никак не связаны с Mojang Studios или Microsoft. Все права на игру Minecraft принадлежат Mojang Studios.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Контакты</h2>
                            <p>
                                По всем вопросам вы можете связаться с нами по электронной почте: <a href="mailto:info@storylegends.xyz" className="text-blue-400 hover:text-blue-300">info@storylegends.xyz</a>
                            </p>
                        </section>
                    </div>
                </GlassCard>
            </div>
        </Layout>
    );
};

export default PrivacyPolicy;
