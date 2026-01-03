import Layout from '../components/Layout';
import { FileSignature, Book, Gavel, MessageSquare, Map, Info } from 'lucide-react';

const Rules = () => {
  return (
    <Layout>
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-story-gold/20 blur-[100px] rounded-full -z-10" />
          <FileSignature className="w-20 h-20 text-story-gold mx-auto mb-6 animate-pulse-slow" />
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-story-gold via-white to-legends-blue bg-clip-text text-transparent drop-shadow-lg">
            Правила
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Свод правил и рекомендаций для комфортной игры на сервере.
          </p>
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
