import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PasswordInput({ 
  value, 
  onChange, 
  placeholder = "Enter your password", 
  required = true,
  minLength,
  className = ""
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={isVisible ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-neutral-300 rounded-xl text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all placeholder:text-slate-400 pr-12 ${className}`}
      />
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ember transition-colors p-1 flex items-center justify-center outline-none"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Main eye shape */}
          <motion.path
            animate={{
              d: isVisible 
                ? "M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
                : "M2 12C2 12 5 17 12 17C19 17 22 12 22 12"
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
          {/* Pupil */}
          <motion.circle
            cx="12" cy="12" r="3"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isVisible ? 1 : 0,
              opacity: isVisible ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
          {/* Eyelashes for closed eye */}
          <motion.g
            initial={{ opacity: 1, y: 0 }}
            animate={{
              opacity: isVisible ? 0 : 1,
              y: isVisible ? -5 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <path d="M12 17V19.5" />
            <path d="M16 16.2L17.5 18" />
            <path d="M8 16.2L6.5 18" />
          </motion.g>
        </svg>
      </button>
    </div>
  );
}
