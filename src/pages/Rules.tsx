import Layout from '../components/Layout';
import { Shield, AlertTriangle, Book, Gavel, MessageSquare, Map, Info } from 'lucide-react';

const Rules = () => {
  return (
    <Layout>
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <Shield className="w-12 h-12 md:w-16 md:h-16 text-story-gold mx-auto mb-4 md:mb-6 animate-pulse-slow" />
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-story-gold via-white to-legends-blue bg-clip-text text-transparent">
            Правила сервера
          </h1>
          <div className="p-4 md:p-6 rounded-2xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div className="space-y-2 text-gray-300">
                <p>Подавая заявку, вы автоматически соглашаетесь с правилами и принимаете на себя ответственность.</p>
                <p>Правила могут быть изменены в любой момент и без уведомления игроков.</p>
                <p>Администратор сам решает ваше наказание.</p>
                <p>Администратор может выдать наказание даже если нет четкого правила.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rules Sections */}
        <div className="space-y-12">

          {/* Section 1: General Rules */}
          <section className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <Book className="w-8 h-8 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">1. Общие правила</h2>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="pl-4 border-l-2 border-white/10 hover:border-blue-400 transition-colors">
                  <span className="font-bold text-blue-400 mr-2">1.1.</span>
                  Играть можно только с модификациями, которые не дают преимущества над игроками или преимущества в развитии.
                  <div className="mt-2 text-sm text-gray-400 bg-black/30 p-3 rounded-lg">
                    <span className="text-green-400 font-bold">Разрешено:</span> Уменьшенный огонь, FullBright, Показ хп.<br />
                    <span className="text-red-400 font-bold">Запрещено:</span> X-Ray, AutoSwitch.<br />
                    <span className="text-gray-500 italic">Если есть вопросы, напишите администратору.</span>
                  </div>
                </div>

                <div className="pl-4 border-l-2 border-white/10 hover:border-blue-400 transition-colors">
                  <span className="font-bold text-blue-400 mr-2">1.2.</span>
                  Ответственность всегда несет владелец аккаунта.
                </div>

                <div className="pl-4 border-l-2 border-white/10 hover:border-blue-400 transition-colors">
                  <span className="font-bold text-blue-400 mr-2">1.3.</span>
                  Запрещено обходить блокировку любым способом.
                </div>

                <div className="pl-4 border-l-2 border-white/10 hover:border-blue-400 transition-colors">
                  <span className="font-bold text-blue-400 mr-2">1.4.</span>
                  Запрещено мешать работе сервера.
                </div>

                <div className="pl-4 border-l-2 border-white/10 hover:border-blue-400 transition-colors">
                  <span className="font-bold text-blue-400 mr-2">1.5.</span>
                  Запрещено скрывать и использовать баги. При обнаружении багов - вы обязаны сообщить администрации. Если вы не уверены, баг ли это, то спросите администрацию.
                </div>

                <div className="pl-4 border-l-2 border-white/10 hover:border-blue-400 transition-colors">
                  <span className="font-bold text-blue-400 mr-2">1.6.</span>
                  <span className="font-bold text-red-400">Строго запрещено:</span>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400 ml-4">
                    <li>Намеренное использование никнейма, схожего на никнейм другого игрока, чтобы выдать себя за него.</li>
                    <li>Проявление действий, направленных на возбуждение ненависти или вражды, а также на унижение достоинства.</li>
                    <li>Доксинг (поиск и раскрытие личной информации без согласия).</li>
                    <li>Использование дополнительных аккаунтов для обхода ограничений.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Communication */}
          <section className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <MessageSquare className="w-8 h-8 text-green-400" />
                <h2 className="text-2xl font-bold text-white">2. Правила общения</h2>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="pl-4 border-l-2 border-white/10 hover:border-green-400 transition-colors">
                  <span className="font-bold text-green-400 mr-2">2.1.</span>
                  <span className="font-bold text-red-400">Запрещено:</span>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400 ml-4">
                    <li>Нарушение общих правил и призыв к этому.</li>
                    <li>Неадекватное поведение, спам, флуд.</li>
                    <li>Реклама, упоминание сторонних серверов (кроме серверов мини-игр).</li>
                    <li>Реклама сторонних ресурсов.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Gameplay */}
          <section className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <Gavel className="w-8 h-8 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">3. Правила игры на сервере</h2>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="pl-4 border-l-2 border-white/10 hover:border-orange-400 transition-colors">
                  <span className="font-bold text-orange-400 mr-2">3.1.</span>
                  Для отметки занятой территории необходимо использовать явные и заметные признаки (таблички, полублоки). По умолчанию она охватывает всю высоту мира от -64 до 320.
                </div>

                <div className="pl-4 border-l-2 border-white/10 hover:border-orange-400 transition-colors">
                  <span className="font-bold text-orange-400 mr-2">3.2.</span>
                  Возврат вещей в случае смерти не производится.
                </div>

                <div className="pl-4 border-l-2 border-white/10 hover:border-orange-400 transition-colors">
                  <span className="font-bold text-orange-400 mr-2">3.3.</span>
                  Запрещена любая коммерческая деятельность кроме игровой.
                </div>

                <div className="pl-4 border-l-2 border-white/10 hover:border-orange-400 transition-colors">
                  <span className="font-bold text-orange-400 mr-2">3.4.</span>
                  <span className="font-bold text-red-400">Запрещено:</span>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400 ml-4">
                    <li>Гриферство, воровство и читерство в любом виде.</li>
                    <li>Дюп (Исключение: Нитки, ковры и гуси для динамита).</li>
                    <li>Установка голов игроков в одном месте в большом количестве.</li>
                    <li>Добыча руд, ресурсов и поиск данжей с помощью модификаций.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Lore */}
          <section className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <Map className="w-8 h-8 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">4. Правила лор момента</h2>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="pl-4 border-l-2 border-white/10 hover:border-purple-400 transition-colors">
                  <span className="font-bold text-purple-400 mr-2">4.1.</span>
                  Никто не обязан участвовать в лоре и интересоваться им, вы не можете заставить человека принять участие.
                </div>

                <div className="pl-4 border-l-2 border-white/10 hover:border-purple-400 transition-colors">
                  <span className="font-bold text-purple-400 mr-2">4.2.</span>
                  Администратор является тем же игроком, что и вы. Выкрики по типу: "Админ балуется", "Никнейм устроил лор" и подобие - запрещены. Выкрики по типу "ЛОР" допустимы.
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default Rules;
