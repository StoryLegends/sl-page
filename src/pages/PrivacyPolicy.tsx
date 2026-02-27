import Layout from '../components/Layout';
import GlassCard from '../components/ui/GlassCard';
import SEO from '../components/SEO';

const PrivacyPolicy = () => {
    return (
        <Layout>
            <SEO
                title="Политика конфиденциальности"
                description="Политика обработки персональных данных и конфиденциальности на сайте и сервере StoryLegends."
            />
            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 font-minecraft text-center">
                    Политика конфиденциальности
                </h1>

                <GlassCard className="p-8 text-gray-200">
                    <div className="space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Общие положения</h2>
                            <p>
                                Данная политика описывает, какие данные собирает сервис StoryLegends, как они хранятся и для чего используются. Администрация обязуется защищать вашу конфиденциальность и использовать предоставленную информацию только в рамках управления сервером и связанными ресурсами.
                            </p>
                            <p className="mt-2">
                                При регистрации аккаунта на сайте мы собираем следующие данные:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li><strong>Email-адрес:</strong> Используется для подтверждения аккаунта, восстановления пароля и отправки важных системных уведомлений.</li>
                                <li><strong>Пароль:</strong> Хранится в зашифрованном виде (хеш). Администрация не имеет доступа к вашему паролю.</li>
                                <li><strong>Никнейм в игре (Minecraft):</strong> Необходим для добавления в WhiteList сервера и синхронизации прогресса.</li>
                                <li><strong>Discord тег/ID:</strong> Необходим для связи и автоматической выдачи ролей на нашем Discord-сервере.</li>
                                <li><strong>2FA (Google Authenticator):</strong> Для двухфакторной аутентификации используется стороннее приложение (например, Google Authenticator). Мы храним только секретный ключ для генерации кодов.</li>
                                <li><strong>IP-адреса и User-Agent:</strong> Собираются при регистрации и входах на сайт исключительно в целях безопасности (для защиты от ботов, расследования взломов и выдачи наказаний нарушителям).</li>
                                <li><strong>Данные анкет (Заявки):</strong> Ответы на вопросы о вас, ваши намерения и биография сохраняются для оценки вашей кандидатуры администрацией.</li>
                            </ul>
                            <p className="mt-2">
                                Эти данные никогда не передаются и не продаются третьим лицам.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Сроки хранения данных</h2>
                            <p>
                                В соответствии с принципами GDPR, мы устанавливаем четкие сроки хранения ваших данных:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>
                                    <strong className="text-white">Отклоненные заявки:</strong> Хранятся в базе для возможности повторной подачи в новом сезоне или апелляций.
                                </li>
                                <li>
                                    <strong className="text-white">Принятые игроки:</strong> Данные хранятся в течение всего периода активности аккаунта на сайте и сервере.
                                </li>
                                <li>
                                    <strong className="text-white">Удаление данных:</strong> По запросу пользователя (через администрацию) или при удалении аккаунта все личные данные стираются или анонимизируются. IP-адреса забаненных пользователей хранятся навсегда для поддержания блокировки.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Механизмы авторизации и безопасность</h2>
                            <p>
                                Безопасность ваших данных — наш высокий приоритет. Все пароли надежно шифруются, а доступ к критическим данным строго ограничен.
                                Мы используем локальное хранилище браузера (LocalStorage) для сохранения сессий авторизации. Мы настоятельно рекомендуем включить двухфакторную аутентификацию (2FA) в личном кабинете для дополнительной защиты аккаунта.
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>
                                    <strong className="text-white">reCAPTCHA v3 by Google:</strong> Используется на формах регистрации и входа для защиты от спама и автоматических регистраций. Сервис собирает анонимные поведенческие данные и имеет собственные <a href="https://policies.google.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">политики конфиденциальности</a> и <a href="https://policies.google.com/terms" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">пользовательское соглашение</a>.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Сторонние сервисы</h2>
                            <p>
                                В нашем сервисе используются сторонние инструменты (Google Analytics, YouTube, reCAPTCHA by Google), которые могут собирать обезличенные данные в соответствии с их собственными политиками конфиденциальности. Мы не несем ответственности за информацию, обрабатываемую этими платформами.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Отказ от ответственности (Mojang)</h2>
                            <p>
                                StoryLegends не является официальным продуктом Minecraft. Мы никак не связаны с Mojang Studios или Microsoft. Все права на игру Minecraft принадлежат Mojang Studios.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. Контакты</h2>
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
