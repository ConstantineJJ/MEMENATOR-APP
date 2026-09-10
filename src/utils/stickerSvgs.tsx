import React from 'react';

interface StickerSvgProps {
  stickerId: string;
  className?: string;
  badgeText?: string;
}

export const StickerSvg: React.FC<StickerSvgProps> = ({ stickerId, className = 'w-10 h-10', badgeText }) => {
  switch (stickerId) {
    // ================= PEPE COLLECTION =================
    case 'pepe-smug':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Smug Pepe Head */}
          <path
            d="M20 70 C14 55 16 34 32 24 C44 16 62 16 74 24 C86 32 88 52 82 68 C76 80 62 86 46 86 C32 86 24 80 20 70 Z"
            fill="#72a838"
            stroke="#213d11"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Eyelids and eyes */}
          <path d="M26 40 C34 33 46 33 50 40 C46 44 32 44 26 40 Z" fill="#4d7422" stroke="#213d11" strokeWidth="2.5" />
          <path d="M54 38 C62 31 74 31 78 38 C74 42 60 42 54 38 Z" fill="#4d7422" stroke="#213d11" strokeWidth="2.5" />
          {/* Pupils */}
          <ellipse cx="38" cy="38" rx="4.5" ry="3.5" fill="#18181b" />
          <ellipse cx="66" cy="36" rx="4.5" ry="3.5" fill="#18181b" />
          <circle cx="39.5" cy="37" r="1.2" fill="#ffffff" />
          <circle cx="67.5" cy="35" r="1.2" fill="#ffffff" />
          {/* Smug Smirk Lips */}
          <path
            d="M28 58 C38 60 56 60 76 52 C72 63 56 68 40 68 C34 68 30 64 28 58 Z"
            fill="#e26661"
            stroke="#213d11"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M28 58 C46 62 64 58 76 52" stroke="#213d11" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'pepe-happy':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Feels Good Man */}
          <path
            d="M18 68 C14 50 18 32 34 22 C48 14 66 14 78 22 C90 32 88 54 82 70 C74 82 58 86 44 86 C30 86 22 80 18 68 Z"
            fill="#76ac3b"
            stroke="#1e380f"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Curved Happy Eyes */}
          <path d="M26 40 C34 32 46 32 52 40" stroke="#1e380f" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M56 40 C64 32 76 32 82 40" stroke="#1e380f" strokeWidth="3.5" strokeLinecap="round" />
          {/* Big Cheerful Grin */}
          <path
            d="M26 56 C38 72 64 72 78 56 C68 76 36 76 26 56 Z"
            fill="#ea6661"
            stroke="#1e380f"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <ellipse cx="52" cy="65" rx="10" ry="5" fill="#f87171" opacity="0.8" />
        </svg>
      );

    case 'pepe-sad':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sad Pepe */}
          <path
            d="M20 72 C14 55 16 35 32 24 C44 16 62 16 74 24 C86 35 88 55 82 72 C74 84 58 86 46 86 C32 86 24 82 20 72 Z"
            fill="#689a33"
            stroke="#1e380f"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Drooping Sad Eyelids */}
          <path d="M24 36 C34 42 46 38 48 34" stroke="#1e380f" strokeWidth="3" strokeLinecap="round" />
          <path d="M54 34 C58 38 70 42 80 36" stroke="#1e380f" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="36" cy="40" rx="4.5" ry="3.5" fill="#18181b" />
          <ellipse cx="66" cy="40" rx="4.5" ry="3.5" fill="#18181b" />
          {/* Downturned Sad Mouth */}
          <path
            d="M30 68 C42 56 60 56 72 68 C62 62 40 62 30 68 Z"
            fill="#d95d58"
            stroke="#1e380f"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Tear */}
          <path d="M72 44 C72 50 67 56 67 56 C67 56 62 50 62 44 C62 40 66 38 67 38 C68 38 72 40 72 44 Z" fill="#38bdf8" />
        </svg>
      );

    case 'pepe-monkas':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* MonkaS Panicking Pepe */}
          <path
            d="M18 68 C14 50 18 30 34 20 C48 12 66 12 78 20 C90 30 88 52 82 68 C74 82 58 86 44 86 C30 86 22 80 18 68 Z"
            fill="#76ac3b"
            stroke="#1e380f"
            strokeWidth="3.5"
          />
          {/* Huge Panicked Eyes */}
          <circle cx="36" cy="38" r="12" fill="#ffffff" stroke="#1e380f" strokeWidth="2.5" />
          <circle cx="66" cy="38" r="12" fill="#ffffff" stroke="#1e380f" strokeWidth="2.5" />
          <circle cx="37" cy="38" r="4.5" fill="#000000" />
          <circle cx="67" cy="38" r="4.5" fill="#000000" />
          {/* Nervous mouth */}
          <path d="M30 65 Q 40 68 50 64 Q 60 68 72 65" stroke="#1e380f" strokeWidth="3" strokeLinecap="round" />
          {/* Sweat Drops */}
          <path d="M78 26 C82 31 82 35 79 37 C76 39 72 37 72 33 C72 29 78 26 78 26 Z" fill="#38bdf8" />
          <path d="M22 28 C26 33 26 37 23 39 C20 41 16 39 16 35 C16 31 22 28 22 28 Z" fill="#38bdf8" />
        </svg>
      );

    // ================= DOGE COLLECTION =================
    case 'doge-classic':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Doge Head */}
          <path
            d="M25 45 C15 30 18 16 30 14 C38 12 42 22 45 28 C55 24 68 24 76 32 C85 24 92 16 96 22 C99 30 92 46 88 56 C90 70 78 86 56 88 C34 90 20 74 25 45 Z"
            fill="#dca15c"
            stroke="#854d0e"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* White muzzle */}
          <ellipse cx="58" cy="62" rx="18" ry="14" fill="#fef3c7" />
          {/* Nose */}
          <ellipse cx="58" cy="54" rx="6" ry="4" fill="#1c1917" />
          {/* Iconic Curved Side-Eye */}
          <ellipse cx="44" cy="40" rx="6" ry="7" fill="#ffffff" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="43" cy="40" r="3.8" fill="#451a03" />
          <circle cx="44.5" cy="38.5" r="1.4" fill="#ffffff" />
          {/* Raised curious eyebrows */}
          <path d="M38 29 C44 26 50 30 52 32" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M68 32 C74 30 80 34 82 36" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          {/* Cute mouth */}
          <path d="M53 58 Q 58 64 63 58" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'doge-cheems':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Round chubby Cheems */}
          <circle cx="50" cy="52" r="34" fill="#d99852" stroke="#78350f" strokeWidth="3" />
          <path d="M22 28 C20 18 30 16 36 24 Z" fill="#b45309" stroke="#78350f" strokeWidth="2.5" />
          <path d="M78 28 C80 18 70 16 64 24 Z" fill="#b45309" stroke="#78350f" strokeWidth="2.5" />
          <ellipse cx="50" cy="64" rx="20" ry="14" fill="#fef3c7" />
          <ellipse cx="50" cy="58" rx="5" ry="3.5" fill="#1c1917" />
          {/* Melancholy squinty eyes */}
          <path d="M36 44 C40 42 46 42 48 45" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M54 45 C56 42 62 42 66 44" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="43" cy="45" r="2.5" fill="#451a03" />
          <circle cx="59" cy="45" r="2.5" fill="#451a03" />
        </svg>
      );

    // ================= GIGACHAD =================
    case 'char-gigachad':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Chiseled Jawline */}
          <path
            d="M26 32 C26 20 40 18 50 18 C60 18 74 20 74 32 C74 46 76 56 68 74 L50 88 L32 74 C24 56 26 46 26 32 Z"
            fill="#e2e8f0"
            stroke="#09090b"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Chiseled Beard & Stubble */}
          <path
            d="M30 52 C30 68 36 78 50 86 C64 78 70 68 70 52 C64 60 58 64 50 64 C42 64 36 60 30 52 Z"
            fill="#18181b"
          />
          {/* Dark Sunglasses / Smug Eyes */}
          <path
            d="M32 38 L46 40 L44 48 L32 46 Z M54 40 L68 38 L68 46 L56 48 Z"
            fill="#09090b"
          />
          <path d="M46 40 L54 40" stroke="#09090b" strokeWidth="2.5" />
          {/* Sculpted cheekbone accents */}
          <path d="M30 46 L38 56" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M70 46 L62 56" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
          {/* Confident smirk */}
          <path d="M44 68 Q 50 72 58 68" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // ================= TROLLFACE =================
    case 'char-trollface':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Asymmetrical head outline */}
          <path
            d="M18 56 C14 36 28 22 48 20 C70 18 84 28 88 44 C92 62 82 76 68 82 C48 90 28 86 22 74 C18 68 18 62 18 56 Z"
            fill="#f8fafc"
            stroke="#09090b"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Huge grin with teeth grid */}
          <path
            d="M26 50 C44 48 70 46 84 56 C74 76 46 78 28 68 C24 62 24 54 26 50 Z"
            fill="#ffffff"
            stroke="#09090b"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Teeth dividers */}
          <path d="M38 52 L38 68 M48 50 L48 72 M58 50 L58 72 M68 52 L68 70 M76 54 L76 64" stroke="#09090b" strokeWidth="1.8" />
          <path d="M26 58 C46 58 66 56 82 62" stroke="#09090b" strokeWidth="1.8" />
          {/* Mischievous eyes & wrinkles */}
          <path d="M40 36 C44 32 50 32 52 36" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="46" cy="38" r="2.5" fill="#09090b" />
          <path d="M64 36 C68 32 74 32 76 36" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="70" cy="38" r="2.5" fill="#09090b" />
          {/* Forehead & cheek wrinkles */}
          <path d="M46 26 Q 60 24 72 28" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 46 C24 42 28 42 30 46" stroke="#09090b" strokeWidth="1.8" />
        </svg>
      );

    // ================= WOJAK COLLECTION =================
    case 'wojak-classic':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Bald pale head */}
          <path
            d="M26 62 C22 44 26 26 44 18 C62 10 76 18 80 34 C84 48 80 66 74 76 C64 86 44 86 32 80 C26 74 26 68 26 62 Z"
            fill="#fef3c7"
            stroke="#1c1917"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Sad forehead wrinkles */}
          <path d="M44 26 Q 54 22 66 26" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          <path d="M46 30 Q 54 26 64 30" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          {/* Downcast eyes */}
          <ellipse cx="44" cy="42" rx="4" ry="5" fill="#ffffff" stroke="#1c1917" strokeWidth="2" />
          <circle cx="45" cy="43" r="2.2" fill="#1c1917" />
          <ellipse cx="64" cy="42" rx="4" ry="5" fill="#ffffff" stroke="#1c1917" strokeWidth="2" />
          <circle cx="65" cy="43" r="2.2" fill="#1c1917" />
          <path d="M38 36 Q 44 38 48 36" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
          <path d="M58 36 Q 64 38 70 36" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
          {/* Melancholy mouth */}
          <path d="M46 64 Q 54 62 62 66" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'wojak-crying':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Crying Wojak with Tears */}
          <path
            d="M26 62 C22 44 26 26 44 18 C62 10 76 18 80 34 C84 48 80 66 74 76 C64 86 44 86 32 80 C26 74 26 68 26 62 Z"
            fill="#fef3c7"
            stroke="#1c1917"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Red puffy eye contours */}
          <ellipse cx="44" cy="42" rx="6" ry="7" fill="#fecaca" opacity="0.6" />
          <ellipse cx="64" cy="42" rx="6" ry="7" fill="#fecaca" opacity="0.6" />
          <ellipse cx="44" cy="42" rx="3.5" ry="4.5" fill="#ffffff" stroke="#1c1917" strokeWidth="1.8" />
          <circle cx="45" cy="43" r="2" fill="#1c1917" />
          <ellipse cx="64" cy="42" rx="3.5" ry="4.5" fill="#ffffff" stroke="#1c1917" strokeWidth="1.8" />
          <circle cx="65" cy="43" r="2" fill="#1c1917" />
          {/* Streaming tears */}
          <path d="M43 48 C41 58 40 68 42 76" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
          <path d="M63 48 C65 58 66 68 64 76" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
          {/* Trembling mouth */}
          <path d="M44 66 Q 54 60 64 68" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'wojak-chad':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Yes Chad / Nordic Chad Profile */}
          {/* Blond Hair */}
          <path
            d="M32 20 C42 12 60 14 66 24 C72 32 72 42 66 50 C58 54 44 48 38 42 C32 36 30 26 32 20 Z"
            fill="#facc15"
            stroke="#854d0e"
            strokeWidth="2.5"
          />
          {/* Strong Jawline Face in Profile */}
          <path
            d="M42 34 L62 34 L62 46 L72 50 L64 54 L68 62 L60 74 L46 76 L40 60 Z"
            fill="#fed7aa"
            stroke="#1c1917"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Full trimmed blond beard */}
          <path
            d="M48 54 C54 54 62 58 68 62 C64 76 56 82 46 82 C42 74 44 64 48 54 Z"
            fill="#eab308"
            stroke="#854d0e"
            strokeWidth="2.5"
          />
          {/* Calm determined eye */}
          <path d="M54 40 L60 40" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="58" cy="42" r="1.5" fill="#1c1917" />
        </svg>
      );

    // ================= POP CAT =================
    case 'char-popcat':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pop Cat Head */}
          <circle cx="50" cy="52" r="34" fill="#fef08a" stroke="#854d0e" strokeWidth="3" />
          {/* Ears with pink interior */}
          <path d="M22 28 L34 22 L36 36 Z" fill="#fde047" stroke="#854d0e" strokeWidth="2.5" />
          <path d="M25 28 L32 24 L34 33 Z" fill="#f472b6" />
          <path d="M78 28 L66 22 L64 36 Z" fill="#fde047" stroke="#854d0e" strokeWidth="2.5" />
          <path d="M75 28 L68 24 L66 33 Z" fill="#f472b6" />
          {/* Cute round dark eyes */}
          <circle cx="36" cy="44" r="4.5" fill="#18181b" />
          <circle cx="38" cy="42.5" r="1.5" fill="#ffffff" />
          <circle cx="64" cy="44" r="4.5" fill="#18181b" />
          <circle cx="66" cy="42.5" r="1.5" fill="#ffffff" />
          {/* Giant Open Mouth :O */}
          <ellipse cx="50" cy="62" rx="16" ry="16" fill="#18181b" stroke="#854d0e" strokeWidth="2.5" />
          <ellipse cx="50" cy="68" rx="8" ry="6" fill="#fb7185" />
        </svg>
      );

    // ================= THIS IS FINE DOG =================
    case 'char-this-is-fine':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Dog Head */}
          <path
            d="M30 40 C30 28 42 24 54 24 C66 24 74 32 74 44 C74 58 66 74 52 74 C38 74 30 60 30 40 Z"
            fill="#d97706"
            stroke="#451a03"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Floppy Dog Ear */}
          <path d="M26 36 C22 46 22 56 28 62 C32 60 32 48 30 36 Z" fill="#b45309" stroke="#451a03" strokeWidth="2.5" />
          {/* Cute Bowler Hat */}
          <path d="M38 24 L66 24 L62 14 L42 14 Z" fill="#451a03" />
          <ellipse cx="52" cy="24" rx="18" ry="3.5" fill="#292524" />
          <rect x="42" y="21" width="20" height="3" fill="#dc2626" />
          {/* Unfazed calm eyes */}
          <ellipse cx="46" cy="42" rx="4" ry="4" fill="#ffffff" stroke="#451a03" strokeWidth="2" />
          <circle cx="47" cy="42" r="2" fill="#451a03" />
          <ellipse cx="62" cy="42" rx="4" ry="4" fill="#ffffff" stroke="#451a03" strokeWidth="2" />
          <circle cx="63" cy="42" r="2" fill="#451a03" />
          {/* Peaceful little smile */}
          <path d="M48 58 Q 54 62 60 58" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="58" cy="50" rx="4.5" ry="3" fill="#18181b" />
        </svg>
      );

    // ================= TABLE CAT / SMUDGE =================
    case 'char-cat-smudge':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* White Fluffy Confused Cat Head */}
          <circle cx="50" cy="52" r="32" fill="#f8fafc" stroke="#334155" strokeWidth="3" />
          <path d="M24 28 L36 22 L36 36 Z" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />
          <path d="M26 29 L34 24 L34 33 Z" fill="#f472b6" opacity="0.7" />
          <path d="M76 28 L64 22 L64 36 Z" fill="#f8fafc" stroke="#334155" strokeWidth="2.5" />
          <path d="M74 29 L66 24 L66 33 Z" fill="#f472b6" opacity="0.7" />
          {/* Confused Squinty Eyes */}
          <path d="M34 44 Q 40 40 46 44" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          <path d="M54 44 Q 60 40 66 44" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          {/* Pink triangle nose */}
          <polygon points="50,52 46,47 54,47" fill="#f472b6" />
          {/* Disgusted / Confused mouth */}
          <path d="M44 56 Q 50 60 56 56" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          {/* Whiskers */}
          <path d="M28 50 L42 52 M26 56 L42 55 M72 50 L58 52 M74 56 L58 55" stroke="#94a3b8" strokeWidth="1.5" />
        </svg>
      );

    // ================= STONKS / MEME MAN =================
    case 'char-stonks':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Minimalist 3D Mannequin Head */}
          <path
            d="M30 62 C26 44 32 26 46 20 C60 14 72 24 74 38 C76 52 70 68 62 76 C52 84 36 82 30 62 Z"
            fill="#e2e8f0"
            stroke="#334155"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Stylized sharp nose */}
          <path d="M52 32 L56 50 L48 52" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
          {/* Neutral mouth line */}
          <path d="M46 64 L56 64" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          {/* Green Stonks Arrow ↗ */}
          <path d="M62 60 L78 36 M78 36 L66 36 M78 36 L78 48" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // ================= MEME ACCESSORIES =================
    case 'thug-sunglasses':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 8-bit Pixel Sunglasses - 100% Transparent Exterior */}
          <rect x="10" y="40" width="36" height="18" fill="#18181b" stroke="#000000" strokeWidth="2" />
          <rect x="54" y="40" width="36" height="18" fill="#18181b" stroke="#000000" strokeWidth="2" />
          <rect x="44" y="42" width="12" height="6" fill="#000000" />
          {/* White pixel gleams */}
          <rect x="14" y="44" width="6" height="6" fill="#ffffff" />
          <rect x="22" y="44" width="6" height="6" fill="#ffffff" />
          <rect x="58" y="44" width="6" height="6" fill="#ffffff" />
          <rect x="66" y="44" width="6" height="6" fill="#ffffff" />
          <rect x="18" y="52" width="6" height="4" fill="#a1a1aa" />
          <rect x="62" y="52" width="6" height="4" fill="#a1a1aa" />
        </svg>
      );

    case 'laser-eyes-red':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="30" fill="url(#laser-red-glow)" />
          <circle cx="50" cy="50" r="8" fill="#ef4444" />
          <circle cx="50" cy="50" r="4" fill="#ffffff" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="50" x2="85" y2="50" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <radialGradient id="laser-red-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#dc2626" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );

    case 'laser-eyes-cyan':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="30" fill="url(#laser-cyan-glow)" />
          <circle cx="50" cy="50" r="8" fill="#06b6d4" />
          <circle cx="50" cy="50" r="4" fill="#ffffff" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="50" x2="85" y2="50" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <radialGradient id="laser-cyan-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#0891b2" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );

    case 'gold-chain':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Gold Chain Links */}
          <path d="M15 30 C25 60 75 60 85 30" stroke="#b45309" strokeWidth="8" strokeLinecap="round" />
          <path d="M15 30 C25 60 75 60 85 30" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
          {/* Big Medallion $ */}
          <circle cx="50" cy="65" r="16" fill="#facc15" stroke="#92400e" strokeWidth="3" />
          <circle cx="50" cy="65" r="13" fill="#eab308" />
          <text x="50" y="72" fontSize="20" fontWeight="900" fontFamily="Anton, sans-serif" fill="#713f12" textAnchor="middle">
            $
          </text>
        </svg>
      );

    case 'king-crown':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Golden Crown */}
          <path
            d="M15 65 L10 32 L32 44 L50 20 L68 44 L90 32 L85 65 Z"
            fill="#facc15"
            stroke="#854d0e"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="32" r="3.5" fill="#ef4444" />
          <circle cx="50" cy="20" r="4.5" fill="#3b82f6" />
          <circle cx="88" cy="32" r="3.5" fill="#10b981" />
          <rect x="22" y="58" width="56" height="5" rx="2" fill="#eab308" />
        </svg>
      );

    case 'clown-nose-wig':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Rainbow Wig curls */}
          <circle cx="28" cy="36" r="14" fill="#ef4444" />
          <circle cx="42" cy="24" r="13" fill="#eab308" />
          <circle cx="58" cy="24" r="13" fill="#22c55e" />
          <circle cx="72" cy="36" r="14" fill="#3b82f6" />
          {/* Red shiny clown nose */}
          <circle cx="50" cy="62" r="13" fill="#dc2626" stroke="#991b1b" strokeWidth="2.5" />
          <ellipse cx="46" cy="58" rx="4" ry="2.5" fill="#ffffff" opacity="0.8" />
        </svg>
      );

    case 'devil-horns':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 62 C16 42 22 24 38 20 C34 34 32 48 36 62 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" strokeLinejoin="round" />
          <path d="M78 62 C84 42 78 24 62 20 C66 34 68 48 64 62 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      );

    case 'angel-halo':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="46" rx="36" ry="12" fill="none" stroke="#facc15" strokeWidth="6" />
          <ellipse cx="50" cy="46" rx="36" ry="12" fill="none" stroke="#fef08a" strokeWidth="2.5" opacity="0.9" />
        </svg>
      );

    // ================= MEME STAMPS & BADGES =================
    case 'stamp-wasted':
      return (
        <svg viewBox="0 0 120 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="60" y="29" fontSize="26" fontWeight="900" fontFamily="Impact, Anton, sans-serif" fill="#dc2626" stroke="#000000" strokeWidth="2" textAnchor="middle" letterSpacing="2">
            WASTED
          </text>
        </svg>
      );

    case 'stamp-approved':
      return (
        <svg viewBox="0 0 120 44" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="112" height="36" rx="6" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="3" strokeDasharray="6 2" />
          <text x="60" y="28" fontSize="16" fontWeight="900" fontFamily="Anton, Impact, sans-serif" fill="#10b981" textAnchor="middle" letterSpacing="1.5">
            APPROVED
          </text>
        </svg>
      );

    case 'stamp-top-secret':
      return (
        <svg viewBox="0 0 120 44" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="112" height="36" rx="6" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="3" />
          <text x="60" y="28" fontSize="14" fontWeight="900" fontFamily="Anton, Impact, sans-serif" fill="#ef4444" textAnchor="middle" letterSpacing="1.5">
            TOP SECRET
          </text>
        </svg>
      );

    case 'stamp-100':
      return (
        <svg viewBox="0 0 120 44" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="112" height="36" rx="6" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="3" />
          <text x="60" y="28" fontSize="15" fontWeight="900" fontFamily="Anton, Impact, sans-serif" fill="#f59e0b" textAnchor="middle" letterSpacing="1">
            100% REAL 💯
          </text>
        </svg>
      );

    case 'badge-base':
      return (
        <svg viewBox="0 0 100 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="96" height="32" rx="16" fill="#059669" stroke="#022c22" strokeWidth="2" />
          <text x="50" y="23" fontSize="16" fontWeight="900" fontFamily="Impact, Arial Black, sans-serif" fill="#ffffff" textAnchor="middle">
            БАЗА
          </text>
        </svg>
      );

    case 'badge-cringe':
      return (
        <svg viewBox="0 0 100 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="96" height="32" rx="8" fill="#9333ea" stroke="#3b0764" strokeWidth="2" />
          <text x="50" y="23" fontSize="16" fontWeight="900" fontFamily="Impact, Arial Black, sans-serif" fill="#ffffff" textAnchor="middle">
            КРИНЖ
          </text>
        </svg>
      );

    case 'badge-censored':
      return (
        <svg viewBox="0 0 110 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="106" height="28" rx="4" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
          <text x="55" y="21" fontSize="14" fontWeight="900" fontFamily="Anton, Impact, sans-serif" fill="#ffffff" textAnchor="middle" letterSpacing="2">
            CENSORED
          </text>
        </svg>
      );

    case 'badge-bruh':
      return (
        <svg viewBox="0 0 90 34" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="86" height="30" rx="8" fill="#e11d48" stroke="#4c0519" strokeWidth="2" />
          <text x="45" y="22" fontSize="16" fontWeight="900" fontFamily="Impact, Arial Black, sans-serif" fill="#ffffff" textAnchor="middle">
            BRUH
          </text>
        </svg>
      );

    case 'badge-skill-issue':
      return (
        <svg viewBox="0 0 120 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="116" height="32" rx="8" fill="#ea580c" stroke="#7c2d12" strokeWidth="2" />
          <text x="60" y="23" fontSize="14" fontWeight="900" fontFamily="Impact, Arial Black, sans-serif" fill="#ffffff" textAnchor="middle">
            SKILL ISSUE
          </text>
        </svg>
      );

    case 'badge-scam':
      return (
        <svg viewBox="0 0 100 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="96" height="32" rx="8" fill="#d97706" stroke="#451a03" strokeWidth="2" />
          <text x="50" y="23" fontSize="15" fontWeight="900" fontFamily="Impact, Arial Black, sans-serif" fill="#ffffff" textAnchor="middle">
            СКАМ ⚠️
          </text>
        </svg>
      );

    // ================= SPEECH BUBBLES =================
    case 'bubble-bruh':
    case 'bubble-wait-what':
    case 'bubble-real':
    case 'bubble-no-u': {
      const text =
        stickerId === 'bubble-bruh'
          ? 'BRUH.'
          : stickerId === 'bubble-wait-what'
            ? 'ЧТО?!'
            : stickerId === 'bubble-real'
              ? 'REAL 💯'
              : 'NO U';
      return (
        <svg viewBox="0 0 100 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Speech bubble body + pointer with transparent exterior */}
          <path
            d="M8 8 C8 4 14 2 20 2 L80 2 C86 2 92 4 92 8 L92 34 C92 38 86 40 80 40 L36 40 L20 48 L24 40 L20 40 C14 40 8 38 8 34 Z"
            fill="#ffffff"
            stroke="#09090b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <text x="50" y="26" fontSize="13" fontWeight="900" fontFamily="Anton, Impact, sans-serif" fill="#09090b" textAnchor="middle">
            {text}
          </text>
        </svg>
      );
    }

    // ================= MASCOT WATERMELON BOSS =================
    case 'watermelon-boss':
    default:
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Watermelon Slice */}
          <path
            d="M50 16 L88 72 C50 86 50 86 12 72 Z"
            fill="#ef4444"
            stroke="#15803d"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M12 72 C50 86 50 86 88 72" stroke="#22c55e" strokeWidth="4" />
          {/* Seeds */}
          <circle cx="40" cy="50" r="2.5" fill="#18181b" />
          <circle cx="60" cy="50" r="2.5" fill="#18181b" />
          <circle cx="50" cy="62" r="2.5" fill="#18181b" />
          {/* Cool Sunglasses */}
          <rect x="30" y="38" width="18" height="9" fill="#09090b" />
          <rect x="52" y="38" width="18" height="9" fill="#09090b" />
          <rect x="48" y="40" width="4" height="3" fill="#09090b" />
          <line x1="33" y1="40" x2="42" y2="40" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="55" y1="40" x2="64" y2="40" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );
  }
};
