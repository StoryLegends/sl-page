import React from 'react';
import { Heart, FileText } from 'lucide-react';

const CTASection: React.FC = () => {
    return (
        <div className="text-center py-8 md:py-12 px-4 md:px-0 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-story-gold to-transparent opacity-50" />

            <Heart className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse-slow" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ждем вас на сервере!</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                Всё, что вам нужно сделать — это заполнить заявку. Администрация рассмотрит её и свяжется с вами.
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <a
                    href="https://discord.com/invite/2RxxMnr6X9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg hover:shadow-[#5865F2]/50 flex items-center gap-3 w-full md:w-auto justify-center"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                    </svg>
                    Присоединиться к Discord
                </a>

                <a
                    href="https://forms.gle/gGJjnRsUY3CowzVg6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative px-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg hover:shadow-green-600/50 flex items-center gap-3 w-full md:w-auto justify-center"
                >
                    <FileText className="w-6 h-6" />
                    Подать заявку
                </a>
            </div>
        </div>
    );
};

export default CTASection;
