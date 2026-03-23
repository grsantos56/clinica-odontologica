import React, { useState, useEffect } from 'react';
import { 
    FaWhatsapp, 
    FaTooth, 
    FaUserMd, 
    FaMapMarkerAlt, 
    FaStar, 
    FaInstagram,  
    FaEnvelope,   
    FaGithub,
    FaGoogle, 
    FaQuoteLeft,
    FaChevronLeft,
    FaChevronRight,
    FaConciergeBell,
    FaTimes,
    FaPlusCircle, 
    FaInfoCircle,
    FaHandPointUp 
} from 'react-icons/fa';
import logoImg from '../assets/logo.png'; 

export default function LandingPage() {
    const [profissionais, setProfissionais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedProf, setSelectedProf] = useState(null);

    const WHATSAPP_NUMBER = "1111111111111"; 
    const WHATSAPP_MESSAGE = "Olá! Gostaria de saber mais sobre a clínica.";
    const EMAIL_CONTACT = "email@email.com";
    const INSTAGRAM_URL = "https://www.instagram.com";
    const GITHUB_URL = "https://github.com/grsantos56";
    
    const GOOGLE_REVIEW_LINK = "https://search.google.com/local/writereview?placeid=AAAA"; 
    const GOOGLE_MAPS_EMBED_URL = "https://www.google.com/maps/embed?pb=aaaaaaaa";

    const EQUIPE = [
        {
            id: 1,
            nome: "Dr. Jose Silva",
            cargo: "Dentista",
            especialidade: "Ortodontista e Implantodontista",
            cro: "CRO: 00000",
            fotoUrl: "url_da_foto_do_dentista_extraido_da_cloudinary",
            biografia: "Dr. Jose é especialista em transformar sorrisos através da Ortodontia avançada e Implantodontia. Com anos de experiência clínica, foca em reabilitação oral completa, devolvendo não apenas a estética, mas a função mastigatória e a autoestima de seus pacientes."
        },
        {
            id: 2,
            nome: "Maria dos Santos",
            cargo: "Atendente",
            especialidade: "Recepção e Agendamento",
            cro: null,
            fotoUrl: "url_da_foto_do_atendente_extraido_da_cloudinary",
            biografia: "Maria é o primeiro sorriso que você encontra na clinica. Responsável por acolher nossos pacientes com carinho e agilidade, ela gerencia a agenda e garante que sua experiência na clínica seja organizada e tranquila."
        }
    ];

    const PROCEDIMENTOS_SLIDES = [
        { title: "Endodontia (Canal)", img: "https://res.cloudinary.com/urlfoto", desc: "Tratamento especializado para salvar o dente e aliviar a dor." },
        { title: "Exodontia (Extração)", img: "https://res.cloudinary.com/urlfoto", desc: "Remoção cirúrgica segura e confortável de dentes comprometidos." },
        { title: "Profilaxia (Limpeza)", img: "https://res.cloudinary.com/urlfoto", desc: "Limpeza profunda para prevenção de cáries e saúde gengival." },
        { title: "Restauração Dentária", img: "https://res.cloudinary.com/urlfoto", desc: "Recuperação estética e funcional da estrutura do dente." },
        { title: "Implante Dentário", img: "https://res.cloudinary.com/urlfoto", desc: "A solução fixa e duradoura para substituir dentes perdidos." },
        { title: "Prótese Dentária", img: "https://res.cloudinary.com/urlfoto", desc: "Reabilitação oral completa para devolver seu sorriso." },
        { title: "Frenectomia", img: "https://res.cloudinary.com/urlfoto", desc: "Correção cirúrgica do freio lingual ou labial." },
        { title: "Toxina Botulínica", img: "https://res.cloudinary.com/urlfoto", desc: "Tratamento estético facial e terapêutico para bruxismo." },
        { title: "Preenchimento Labial", img: "https://res.cloudinary.com/urlfoto", desc: "Volume e contorno para lábios mais harmônicos." },
        { title: "Fios de Sustentação", img: "https://res.cloudinary.com/urlfoto", desc: "Rejuvenescimento facial com efeito lifting natural." },
        { title: "Coroa de Porcelana", img: "https://res.cloudinary.com/urlfoto", desc: "Máxima estética e resistência para reconstrução dentária." }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % PROCEDIMENTOS_SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % PROCEDIMENTOS_SLIDES.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? PROCEDIMENTOS_SLIDES.length - 1 : prev - 1));

    const AVALIACOES = [
        { id: 1, nome: "pessoa 1", texto: "Ótimo atendimento, a melhor da cidade 👏❤️ ", estrelas: 5 },
        { id: 2, nome: "pessoa 2", texto: "Clínica linda, ambiente muito confortável e com um atendimento excelente. É a melhor da região, sem dúvidas.", estrelas: 5 },
        { id: 3, nome: "pessoa 3", texto: "Um ambiente confortável e acolhedor. Os profissionais prezam muito pelo bem estar do paciente. Recomendo demais!", estrelas: 5 }
    ];

    const openWhatsApp = () => {
        const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
        window.open(url, '_blank');
    };

    const renderStars = (count) => [...Array(count)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-sm" />);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            
            {/* --- NAVBAR --- */}
            <nav className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-24"> 
                        <div className="flex items-center gap-3">
                            <div className="h-14 w-auto"> 
                                <img src={logoImg} alt="Logo clinica" className="h-full w-auto object-contain" />
                            </div>
                            
                            <div className="flex flex-col items-start leading-none w-fit">
                                <span className="text-[14px] md:text-xl font-serif font-bold tracking-widest text-gray-900 uppercase">Rodrigues</span>
                                <span className="text-[14px] md:text-xl font-serif font-bold tracking-widest text-gray-900 uppercase">Cavalcante</span>

                                <div className="h-[1px] bg-[#c49a6c] w-full mt-1 mb-1"></div>
                                
                                <span className="text-[8px] md:text-[10px] font-serif font-bold tracking-[0.15em] text-[#c49a6c] uppercase">Odontologia & Harmonização</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pl-2 md:pl-0">
                            <button onClick={openWhatsApp} className="flex items-center gap-2 text-green-600 font-bold hover:text-green-700 transition border-2 border-green-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full hover:bg-green-50 text-sm sm:text-base">
                                <FaWhatsapp className="text-lg sm:text-xl" /> <span className="hidden sm:inline">Agendar Consulta</span><span className="sm:hidden">Agendar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ... (RESTO DO CÓDIGO IDÊNTICO) ... */}
            
            <section 
                className="relative text-white py-32 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('https://res.cloudinary.com/dpkfluxse/image/upload/v1765654883/d3de3665-e5e5-4546-aafd-f30496484191.png')" }}
            >
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-lg">Seu Sorriso Começa Aqui</h1>
                    <p className="text-xl md:text-2xl text-gray-100 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                        Tecnologia de ponta e profissionais especializados para cuidar da sua saúde bucal.
                    </p>
                    <button onClick={openWhatsApp} className="px-10 py-4 bg-white text-green-600 font-bold text-lg rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:bg-gray-50 flex items-center gap-3 mx-auto">
                        <FaWhatsapp className="text-3xl" /> AGENDAR AVALIAÇÃO
                    </button>
                </div>
            </section>

            {/* --- PROCEDIMENTOS --- */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-10">
                        <span className="text-indigo-600 font-semibold tracking-wider uppercase text-sm">Tratamentos</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">Nossos Procedimentos</h2>
                    </div>
                    <div className="relative w-full max-w-4xl mx-auto h-[400px] rounded-2xl overflow-hidden shadow-2xl group">
                        <div 
                            className="w-full h-full bg-cover bg-center transition-all duration-500 ease-in-out transform"
                            style={{ backgroundImage: `url(${PROCEDIMENTOS_SLIDES[currentSlide].img})` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 md:p-12">
                                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">{PROCEDIMENTOS_SLIDES[currentSlide].title}</h3>
                                <p className="text-gray-200 text-lg">{PROCEDIMENTOS_SLIDES[currentSlide].desc}</p>
                            </div>
                        </div>
                        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white text-white hover:text-indigo-600 p-3 rounded-full backdrop-blur-sm transition"><FaChevronLeft size={24} /></button>
                        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white text-white hover:text-indigo-600 p-3 rounded-full backdrop-blur-sm transition"><FaChevronRight size={24} /></button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {PROCEDIMENTOS_SLIDES.map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/50'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PROFISSIONAIS --- */}
            <section className="py-20 max-w-7xl mx-auto px-4 bg-gray-50">
                <div className="text-center mb-16">
                    <span className="text-indigo-600 font-semibold tracking-wider uppercase text-sm">Profissionais</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">Nossa Equipe</h2>
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">
                        <span className="sm:hidden">Toque na foto</span>
                        <span className="hidden sm:inline">Passe o mouse na foto</span>
                        {" "}para ver detalhes.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-center">
                    {EQUIPE.map((prof) => {
                        const isDentista = prof.cargo === 'Dentista';

                        return (
                            <div 
                                key={prof.id} 
                                onClick={() => setSelectedProf(prof)}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full hover:-translate-y-2 transition duration-300 border border-gray-100 cursor-pointer group"
                            >
                                <div className="h-80 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                    {prof.fotoUrl ? (
                                        <img src={prof.fotoUrl} alt={prof.nome} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        isDentista ? <FaUserMd className="text-7xl text-gray-300" /> : <FaConciergeBell className="text-7xl text-gray-300" />
                                    )}
                                    
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                                        <span className="bg-white/90 text-indigo-700 font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
                                            <FaInfoCircle /> Ver Detalhes
                                        </span>
                                    </div>

                                    <div className="absolute top-3 right-3 sm:hidden animate-pulse">
                                        <div className="bg-white/80 text-indigo-600 p-2 rounded-full shadow-md backdrop-blur-sm">
                                            <FaHandPointUp size={20} />
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 left-0 w-full p-6 text-white bg-gradient-to-t from-black/80 to-transparent">
                                        <h3 className="text-xl font-bold leading-tight mb-1">{prof.nome}</h3>
                                        <p className="text-indigo-200 font-medium text-sm uppercase tracking-wide flex items-center gap-2">
                                            {isDentista ? <FaUserMd /> : <FaConciergeBell />}
                                            {prof.cargo}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 bg-white">
                                    <div className="space-y-2">
                                        <p className="text-gray-700 font-medium">{prof.especialidade}</p>
                                        {prof.cro && <p className="text-gray-500 text-sm border-t pt-2 mt-2 inline-block">{prof.cro}</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* --- AVALIAÇÕES --- */}
            <section className="py-20 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-600"></div>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <span className="text-indigo-600 font-semibold tracking-wider uppercase text-sm">Depoimentos</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">O que dizem nossos pacientes</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {AVALIACOES.map((avaliacao) => (
                            <div key={avaliacao.id} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition relative">
                                <FaQuoteLeft className="text-4xl text-indigo-100 absolute top-6 left-6" />
                                <div className="relative z-10">
                                    <div className="flex gap-1 mb-4">{renderStars(avaliacao.estrelas)}</div>
                                    <p className="text-gray-600 italic mb-6 leading-relaxed">"{avaliacao.texto}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{avaliacao.nome.charAt(0)}</div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{avaliacao.nome}</p>
                                            <p className="text-xs text-gray-500">Paciente Verificado</p>
                                        </div>
                                        <FaGoogle className="ml-auto text-gray-300 text-lg" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <a href={GOOGLE_REVIEW_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-gray-800 border-2 border-gray-200 font-bold rounded-full hover:border-indigo-600 hover:text-indigo-600 transition shadow-sm hover:shadow-md">
                            <FaGoogle className="text-red-500" /> Avalie nossa clínica no Google
                        </a>
                    </div>
                </div>
            </section>

            {/* --- LOCALIZAÇÃO --- */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-800 flex justify-center items-center gap-2"><FaMapMarkerAlt className="text-red-500"/> Onde Estamos</h2>
                        <p className="text-gray-500 mt-2">Fácil acesso para você e sua família.</p>
                    </div>
                    <div className="w-full h-96 bg-gray-200 rounded-2xl overflow-hidden shadow-lg border border-gray-300 relative">
                        <iframe src={GOOGLE_MAPS_EMBED_URL} width="100%" height="100%" style={{border: 0}} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mapa da Clínica"></iframe>
                    </div>
                </div>
            </section>

            {/* --- RODAPÉ --- */}
            <footer className="bg-gray-900 text-gray-400 pt-12 pb-28 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center md:text-left grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <FaTooth className="text-white text-2xl" />
                            <span className="font-bold text-xl text-white">Clinica</span>
                        </div>
                        <p className="text-sm">Transformando sorrisos e vidas com dedicação.</p>
                    </div>
                    <div className="text-center flex flex-col justify-center">
                        <h4 className="text-white font-bold mb-4">Horário de Atendimento</h4>
                        <p className="text-sm">Segunda a Sexta: 08h - 11:30h e 14h - 18h</p>
                        <p className="text-sm">Sábado: 08h - 11:30h</p>
                        <p className="text-sm">Domingo: fechado</p>
                    </div>
                    <div className="text-center md:text-right flex flex-col items-center md:items-end gap-3">
                        <h4 className="text-white font-bold mb-1">Contato</h4>
                        <div className="flex items-center gap-2 text-sm cursor-pointer hover:text-white transition" onClick={openWhatsApp}>
                            <FaWhatsapp className="text-green-500 text-lg" /> <span>(99) 98497-1708</span>
                        </div>
                        <a href={`mailto:${EMAIL_CONTACT}`} className="flex items-center gap-2 text-sm hover:text-white transition"><FaEnvelope className="text-blue-400 text-lg" /> <span>{EMAIL_CONTACT}</span></a>
                        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-pink-500 transition mt-2"><FaInstagram className="text-pink-500 text-xl" /> <span>@rcodontologia__</span></a>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 text-center mt-12 pt-8 border-t border-gray-800">
                    <p className="text-sm mb-4">© {new Date().getFullYear()} clinicatologia. Todos os direitos reservados.</p>
                    <div className="inline-block mt-2 px-6 py-2 border border-gray-700 rounded-full bg-gray-800/50">
                        <p className="text-sm text-gray-300 flex items-center justify-center gap-2">Desenvolvido por: <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-white font-semibold hover:text-indigo-400 transition-colors flex items-center gap-1"><FaGithub /> Gabriel R. Santos</a></p>
                    </div>
                </div>
            </footer>

            <button onClick={openWhatsApp} className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all z-50 animate-bounce hover:animate-none group">
                <FaWhatsapp className="text-4xl group-hover:scale-110 transition-transform" />
            </button>

            {/* --- MODAL DO PROFISSIONAL --- */}
            {selectedProf && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedProf(null)}>
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative flex flex-col md:flex-row animate-scale-up"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <button onClick={() => setSelectedProf(null)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition">
                            <FaTimes size={20} />
                        </button>

                        <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-200">
                            {selectedProf.fotoUrl ? (
                                <img src={selectedProf.fotoUrl} alt={selectedProf.nome} className="w-full h-full object-cover object-top" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400"><FaUserMd size={80} /></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 text-white">
                                <h3 className="text-2xl md:text-3xl font-bold font-serif">{selectedProf.nome}</h3>
                                <p className="text-indigo-300 font-medium uppercase tracking-wider text-sm mt-1">{selectedProf.cargo}</p>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white">
                            <div className="mb-6">
                                <h4 className="text-indigo-600 font-bold uppercase text-xs tracking-widest mb-2">Especialidades</h4>
                                <p className="text-gray-800 font-semibold text-lg">{selectedProf.especialidade}</p>
                            </div>

                            <div className="mb-6">
                                <h4 className="text-indigo-600 font-bold uppercase text-xs tracking-widest mb-2">Sobre o Profissional</h4>
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base text-justify">
                                    {selectedProf.biografia}
                                </p>
                            </div>

                            {selectedProf.cro && (
                                <div className="mt-auto pt-6 border-t border-gray-100">
                                    <p className="text-gray-400 text-sm font-medium">{selectedProf.cro}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}