import React, { useState } from 'react';

interface HostConciergeModalProps {
  isOpen: boolean;
  hostName: string;
  listingTitle: string;
  onClose: () => void;
}

interface Message {
  sender: 'guest' | 'host';
  text: string;
  time: string;
}

export const HostConciergeModal: React.FC<HostConciergeModalProps> = ({
  isOpen,
  hostName,
  listingTitle,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'host',
      text: `Hola, soy ${hostName}. Será un gusto recibirte en ${listingTitle}. ¿Tienes alguna solicitud especial o duda sobre tu llegada?`,
      time: '12:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      sender: 'guest',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Automated smart concierge response
    await new Promise((r) => setTimeout(r, 900));
    setIsTyping(false);

    let replyText =
      '¡Entendido! Con gusto te apoyamos. Recuerda que la clave de la cerradura digital (#4829) se activa automáticamente a las 15:00 hrs de tu llegada. La red Wi-Fi de alta velocidad es "Roomia_Private" y no requiere contraseña.';

    if (userMsg.text.toLowerCase().includes('estacionamiento')) {
      replyText =
        'El estacionamiento techado para 2 autos está disponible justo al ingresar al portón norte con apertura remota.';
    } else if (userMsg.text.toLowerCase().includes('restaurante') || userMsg.text.toLowerCase().includes('comer')) {
      replyText =
        'Te recomiendo ampliamente visitar la zona gastronómica local a solo 5 minutos a pie. Con gusto te comparto la guía digital.';
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: 'host',
        text: replyText,
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="concierge-title"
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-zinc-200/90 max-w-lg w-full overflow-hidden flex flex-col h-[520px]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-950 text-white font-mono text-xs flex items-center justify-center font-medium">
              {hostName[0]}
            </div>
            <div>
              <h3 id="concierge-title" className="text-xs font-semibold text-zinc-950">
                {hostName} · Concierge
              </h3>
              <p className="text-[10px] text-emerald-600 font-medium">
                En línea · Respuesta habitual en 5 minutos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-zinc-50/30">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.sender === 'guest' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-light leading-relaxed ${
                  m.sender === 'guest'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-white text-zinc-800 border border-zinc-200/80 shadow-xs'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-zinc-400 font-mono mt-1 px-1">
                {m.time}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-light italic p-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span>
              {hostName} está escribiendo...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-zinc-100 bg-white flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe tu mensaje al anfitrión..."
            className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 bg-zinc-50/50"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition shadow-xs"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};
