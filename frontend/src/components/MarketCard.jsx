import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiPlayCircle } from 'react-icons/fi';

const MarketCard = ({ market, onSelect }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', { hour12: false });
      
      const { open_time: open, close_time: close } = market;
      let isOpenMatch = false;
      if (open <= close) {
        isOpenMatch = currentTime >= open && currentTime <= close;
      } else {
        isOpenMatch = currentTime >= open || currentTime <= close;
      }

      const [closeH, closeM] = close.split(':');
      const closeDate = new Date();
      closeDate.setHours(closeH, closeM, 0);
      const diff = closeDate - now;

      if (isOpenMatch) {
        setIsOpen(true);
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }
      } else {
        setIsOpen(false);
        setTimeLeft('--:--:--');
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [market]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`glass-card ${isOpen ? 'glow-green' : 'glow-red'}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tight text-white">{market.name}</h3>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md w-fit">
            <span>{market.open_time}</span>
            <span className="w-1 h-1 bg-indigo-500/30 rounded-full"></span>
            <span>{market.close_time}</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest border ${
          isOpen 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
          {isOpen ? 'AVAILABLE' : 'LOCKED'}
        </div>
      </div>

      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Time Remaining</p>
          <div className="flex items-center gap-3">
            <FiClock className={`text-xl ${isOpen ? 'text-emerald-400' : 'text-gray-600'}`} />
            <span className={`font-mono text-3xl font-black tracking-tighter ${isOpen ? 'text-white' : 'text-gray-600'}`}>
              {timeLeft}
            </span>
          </div>
        </div>
        {isOpen && (
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="p-3 bg-emerald-500/10 rounded-2xl"
          >
            <FiPlayCircle className="text-2xl text-emerald-400" />
          </motion.div>
        )}
      </div>

      <button 
        disabled={!isOpen}
        onClick={() => onSelect(market)}
        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] transition-all duration-300 ${
          isOpen 
            ? 'primary-btn shadow-lg hover:shadow-indigo-500/20' 
            : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
        }`}
      >
        {isOpen ? 'PLACE YOUR BET' : 'MARKET CLOSED'}
      </button>
    </motion.div>
  );
};

export default MarketCard;
