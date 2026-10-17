import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { submitEnquiry, submitCampusVisit, isConfigured as dbConfigured } from './lib/db'
import { ScrollReveal } from './components/ScrollReveal'
import { CountUp } from './components/CountUp'
import { GalleryLightbox, type GalleryItemData } from './components/GalleryLightbox'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './components/ui/accordion'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from './components/ui/tabs'

// Cache-busting parameter for static assets so phones and browsers never get stuck with stale cached files
const ASSET_V = '?v=2'

// ── Decorative helpers ──────────────────────────────────────────────────────

function Cloud({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={style} className="pointer-events-none select-none">
      <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
        <ellipse cx="60" cy="45" rx="55" ry="18" fill="white" fillOpacity="0.7" />
        <ellipse cx="40" cy="38" rx="28" ry="22" fill="white" fillOpacity="0.7" />
        <ellipse cx="70" cy="32" rx="32" ry="26" fill="white" fillOpacity="0.7" />
        <ellipse cx="90" cy="40" rx="22" ry="18" fill="white" fillOpacity="0.7" />
      </svg>
    </div>
  )
}

function Star({ color = '#f5d86b', size = 20, style }: { color?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div style={style} className="animate-twinkle pointer-events-none">
      <svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
        <polygon points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7" />
      </svg>
    </div>
  )
}

function Balloon({ color = '#ffd6b0', style }: { color?: string; style?: React.CSSProperties }) {
  return (
    <div style={style} className="animate-float pointer-events-none">
      <svg width="36" height="56" viewBox="0 0 36 56" fill="none">
        <ellipse cx="18" cy="18" rx="16" ry="18" fill={color} />
        <path d="M18 36 Q20 42 18 48" stroke="#c4a0b0" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="13" cy="12" rx="4" ry="6" fill="white" fillOpacity="0.35" />
      </svg>
    </div>
  )
}

// ── Mascots ─────────────────────────────────────────────────────────────────

function TeddyMascot({ size = 180 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ears */}
      <circle cx="50" cy="52" r="22" fill="#d4956a" />
      <circle cx="50" cy="52" r="14" fill="#e8b48a" />
      <circle cx="130" cy="52" r="22" fill="#d4956a" />
      <circle cx="130" cy="52" r="14" fill="#e8b48a" />
      {/* head */}
      <circle cx="90" cy="82" r="54" fill="#e8b48a" />
      {/* eyes */}
      <circle cx="72" cy="72" r="8" fill="#3d2210" />
      <circle cx="108" cy="72" r="8" fill="#3d2210" />
      <circle cx="74" cy="70" r="2.5" fill="white" />
      <circle cx="110" cy="70" r="2.5" fill="white" />
      {/* nose */}
      <ellipse cx="90" cy="90" rx="12" ry="8" fill="#c47050" />
      <circle cx="90" cy="88" r="5" fill="#a85840" />
      {/* mouth */}
      <path d="M80 100 Q90 112 100 100" stroke="#3d2210" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* cheeks */}
      <ellipse cx="65" cy="95" rx="10" ry="7" fill="#f4b0a0" fillOpacity="0.6" />
      <ellipse cx="115" cy="95" rx="10" ry="7" fill="#f4b0a0" fillOpacity="0.6" />
      {/* body */}
      <ellipse cx="90" cy="155" rx="40" ry="32" fill="#e8b48a" />
      {/* tummy */}
      <ellipse cx="90" cy="158" rx="24" ry="20" fill="#f0c8a0" />
      {/* arms */}
      <ellipse cx="45" cy="148" rx="16" ry="10" fill="#e8b48a" transform="rotate(-20 45 148)" />
      <ellipse cx="135" cy="148" rx="16" ry="10" fill="#e8b48a" transform="rotate(20 135 148)" />
      {/* star on tummy */}
      <polygon points="90,148 92,153 97,153 93,156 95,161 90,158 85,161 87,156 83,153 88,153" fill="#f5d86b" />
    </svg>
  )
}

function BunnyMascot() {
  return (
    <svg width="100" height="120" viewBox="0 0 100 120" fill="none">
      <rect x="35" y="5" width="10" height="35" rx="5" fill="#e8d4f8" />
      <rect x="55" y="5" width="10" height="35" rx="5" fill="#e8d4f8" />
      <rect x="37" y="6" width="6" height="25" rx="3" fill="#f4a8c0" />
      <rect x="57" y="6" width="6" height="25" rx="3" fill="#f4a8c0" />
      <circle cx="50" cy="52" r="28" fill="#f0e8fc" />
      <circle cx="40" cy="46" r="5" fill="#3d2240" />
      <circle cx="60" cy="46" r="5" fill="#3d2240" />
      <circle cx="41" cy="44.5" r="1.8" fill="white" />
      <circle cx="61" cy="44.5" r="1.8" fill="white" />
      <ellipse cx="50" cy="57" rx="6" ry="4" fill="#f4a8c0" />
      <path d="M43 64 Q50 72 57 64" stroke="#3d2240" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="36" cy="62" rx="7" ry="5" fill="#f4c0d0" fillOpacity="0.6" />
      <ellipse cx="64" cy="62" rx="7" ry="5" fill="#f4c0d0" fillOpacity="0.6" />
      <ellipse cx="50" cy="96" rx="26" ry="22" fill="#f0e8fc" />
      <ellipse cx="50" cy="98" rx="15" ry="12" fill="#e8d4f8" />
    </svg>
  )
}

function ElephantMascot() {
  return (
    <svg width="100" height="110" viewBox="0 0 100 110" fill="none">
      <circle cx="50" cy="45" r="32" fill="#b8d4f8" />
      <ellipse cx="25" cy="38" rx="14" ry="10" fill="#b8d4f8" />
      <ellipse cx="75" cy="38" rx="14" ry="10" fill="#b8d4f8" />
      <ellipse cx="25" cy="38" rx="9" ry="6" fill="#c8e0fc" />
      <ellipse cx="75" cy="38" rx="9" ry="6" fill="#c8e0fc" />
      <circle cx="40" cy="40" r="5" fill="#2d3a50" />
      <circle cx="60" cy="40" r="5" fill="#2d3a50" />
      <circle cx="41" cy="38.5" r="1.8" fill="white" />
      <circle cx="61" cy="38.5" r="1.8" fill="white" />
      <path d="M42 55 Q50 48 40 62 Q38 68 44 70" stroke="#8ab0e8" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M44 70 Q48 76 44 74" stroke="#8ab0e8" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="36" cy="52" rx="7" ry="5" fill="#c8a0d8" fillOpacity="0.5" />
      <ellipse cx="64" cy="52" rx="7" ry="5" fill="#c8a0d8" fillOpacity="0.5" />
      <ellipse cx="50" cy="88" rx="28" ry="20" fill="#b8d4f8" />
    </svg>
  )
}

function GiraffeMascot() {
  return (
    <svg width="80" height="130" viewBox="0 0 80 130" fill="none">
      <rect x="30" y="15" width="14" height="45" rx="7" fill="#f8d878" />
      <circle cx="37" cy="15" r="20" fill="#f8d878" />
      <rect x="5" y="2" width="7" height="14" rx="3.5" fill="#f8d878" />
      <rect x="62" y="2" width="7" height="14" rx="3.5" fill="#f8d878" />
      <circle cx="8.5" cy="2" r="4" fill="#c0884a" />
      <circle cx="65.5" cy="2" r="4" fill="#c0884a" />
      <circle cx="29" cy="12" r="4" fill="#2d2010" />
      <circle cx="45" cy="12" r="4" fill="#2d2010" />
      <circle cx="30" cy="10.5" r="1.5" fill="white" />
      <circle cx="46" cy="10.5" r="1.5" fill="white" />
      <path d="M29 22 Q37 30 45 22" stroke="#2d2010" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="25" cy="18" rx="6" ry="4" fill="#f4a0a0" fillOpacity="0.5" />
      <ellipse cx="49" cy="18" rx="6" ry="4" fill="#f4a0a0" fillOpacity="0.5" />
      <ellipse cx="37" cy="90" rx="22" ry="32" fill="#f8d878" />
      {/* spots */}
      <ellipse cx="30" cy="80" rx="5" ry="4" fill="#c0884a" fillOpacity="0.4" />
      <ellipse cx="45" cy="95" rx="4" ry="5" fill="#c0884a" fillOpacity="0.4" />
      <ellipse cx="32" cy="105" rx="5" ry="3" fill="#c0884a" fillOpacity="0.4" />
    </svg>
  )
}

function WhatsAppIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.06-1.07l-.29-.17-3.12.82.83-3.04-.19-.3A8.196 8.196 0 0 1 3.8 11.91c0-4.54 3.7-8.24 8.25-8.24zm4.51 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.13.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.21-.18-.46-.3z" />
    </svg>
  )
}

// ── Logo Intro Overlay Animation (Cinematic 6-Scene Brand Story) ──────────────

// Scene state machine for the 6-scene cinematic intro
type IntroScene =
  | 'hidden'       // Initial hidden state
  | 'veena'        // Scene 1: Veena instrument appears
  | 'a_symbol'     // Scene 2: A+veena symbol emerges
  | 'wordmark'     // Scene 3: ABHYUDAYA name reveals
  | 'brand_hold'   // Scene 4: Complete brand lockup holds
  | 'travel'       // Scene 5: Logo travels to navbar
  | 'settled'      // Scene 6: Logo in navbar, hero reveals

function LogoIntroOverlay({
  navbarLogoRef,
  introPhase,
  setIntroPhase,
}: {
  navbarLogoRef: React.RefObject<HTMLDivElement | null>
  introPhase: 'enter' | 'hold' | 'travel' | 'settle' | 'complete'
  setIntroPhase: (p: 'enter' | 'hold' | 'travel' | 'settle' | 'complete') => void
}) {
  const [scene, setScene] = useState<IntroScene>('hidden')
  const [overlayVisible, setOverlayVisible] = useState(true)
  const [overlayFading, setOverlayFading] = useState(false)

  // Travel animation state (for Scene 5 physical movement)
  const [travel, setTravel] = useState({
    x: 0, y: 0, scale: 1, active: false,
  })

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIntroPhase('complete')
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    const t = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay)
      timers.push(id)
    }

    // Scene 1: Veena fades in (150ms delay, 700ms animation)
    t(() => setScene('veena'), 80)

    // Scene 2: Crossfade to A+veena symbol (880ms)
    t(() => setScene('a_symbol'), 880)

    // Scene 3: ABHYUDAYA wordmark fades in below (1380ms)
    t(() => setScene('wordmark'), 1380)
    t(() => setIntroPhase('hold'), 1400)

    // Scene 4: Brand hold — complete logo lockup visible (1380–2000ms)
    t(() => setScene('brand_hold'), 1650)

    // Scene 5: Physical travel to navbar (2050ms)
    t(() => {
      setScene('travel')
      setIntroPhase('travel')
      setOverlayFading(true)

      const navEl = navbarLogoRef.current
      if (navEl) {
        const navImg = navEl.querySelector('img')
        const targetRect = navImg
          ? navImg.getBoundingClientRect()
          : navEl.getBoundingClientRect()

        const targetCX = targetRect.left + targetRect.width / 2
        const targetCY = targetRect.top + targetRect.height / 2

        const viewCX = window.innerWidth / 2
        // The lockup is centered slightly above mid-screen
        const lockupCenterY = window.innerHeight / 2 - 20
        const viewCY = lockupCenterY

        const deltaX = targetCX - viewCX
        const deltaY = targetCY - viewCY

        // The lockup symbol width at display: clamp(140px, 20vw, 200px)
        const displayedSymbolW = Math.min(Math.max(140, window.innerWidth * 0.20), 200)
        const targetW = targetRect.width > 0 ? targetRect.width : 40
        const scaleRatio = targetW / displayedSymbolW

        setTravel({ x: deltaX, y: deltaY, scale: scaleRatio, active: true })
      }
    }, 2050)

    // Scene 6: Navbar + hero reveal (2820ms)
    t(() => {
      setScene('settled')
      setIntroPhase('settle')
    }, 2820)

    // Complete — unmount overlay (3300ms)
    t(() => {
      setIntroPhase('complete')
      setOverlayVisible(false)
    }, 3300)

    return () => { timers.forEach(clearTimeout) }
  }, [navbarLogoRef, setIntroPhase])

  if (!overlayVisible) return null

  // Symbol display widths — veena scene is bigger, then scales down to A symbol size
  const veenaW = 'clamp(200px, 30vw, 320px)'
  const symbolW = 'clamp(140px, 20vw, 200px)'

  // Derived booleans from scene state
  const showVeena = scene !== 'hidden'
  const showASymbol = scene === 'a_symbol' || scene === 'wordmark' || scene === 'brand_hold' || scene === 'travel' || scene === 'settled'
  const showWordmark = scene === 'wordmark' || scene === 'brand_hold' || scene === 'travel' || scene === 'settled'
  const isTraveling = scene === 'travel' || scene === 'settled'

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] pointer-events-none select-none overflow-hidden"
      style={{
        backgroundColor: '#fdfcf9',
        // Subtle warm organic background dots — barely visible
        backgroundImage: `
          radial-gradient(circle at 20% 25%, rgba(255,210,180,0.12) 0%, transparent 55%),
          radial-gradient(circle at 80% 70%, rgba(220,200,255,0.10) 0%, transparent 50%),
          radial-gradient(circle at 55% 10%, rgba(180,240,210,0.08) 0%, transparent 45%)
        `,
        transition: overlayFading ? 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        opacity: overlayFading ? 0 : 1,
      }}
    >
      {/* ── CENTER STAGE: The cinematic logo lockup ── */}
      {/* Outer: X axis travel with horizontal deceleration easing */}
      <div
        className="fixed will-change-transform pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: isTraveling
            ? `translateX(calc(-50% + ${travel.x}px))`
            : 'translateX(-50%)',
          transition: isTraveling
            ? 'transform 0.82s cubic-bezier(0.28, 0.85, 0.32, 1)'
            : 'none',
        }}
      >
        {/* Inner: Y axis + scale with separate easing (creates parabolic arc) */}
        <div
          className="will-change-transform flex flex-col items-center"
          style={{
            transform: isTraveling
              ? `translateY(calc(-50% + ${travel.y}px)) scale(${travel.scale})`
              : 'translateY(-50%) scale(1)',
            transition: isTraveling
              ? 'transform 0.82s cubic-bezier(0.18, 1, 0.36, 1)'
              : 'none',
            // Shift lockup slightly above vertical center for better visual balance
            marginTop: '-20px',
          }}
        >

          {/* Symbol container: veena + A symbol overlay each other */}
          <div
            style={{
              position: 'relative',
              // Veena scene uses larger container; A symbol scene slightly smaller
              width: showASymbol ? symbolW : veenaW,
              aspectRatio: '1024 / 844',
              flexShrink: 0,
              transition: 'width 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* ── SCENE 1: Veena (cropped tight, same container as A symbol) ── */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), filter 0.65s ease-out',
                opacity: showVeena && !showASymbol ? 1 : 0,
                transform: showVeena
                  ? 'scale(1) translateY(0px)'
                  : 'scale(0.78) translateY(16px)',
                filter: showVeena && !showASymbol
                  ? 'blur(0px) drop-shadow(0px 12px 24px rgba(200, 30, 30, 0.20))'
                  : 'blur(5px)',
                willChange: 'opacity, transform, filter',
              }}
            >
              {/* Tight-cropped veena — 931×692 aspect */}
              <img
                src={`/logo_veena_cropped.png${ASSET_V}`}
                alt="Veena — musical beginning"
                style={{ display: 'block', width: '96%', height: '96%', objectFit: 'contain' }}
              />
            </div>

            {/* ── SCENE 2+: A+Veena full brand symbol ── */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), filter 0.65s ease-out',
                opacity: showASymbol ? 1 : 0,
                transform: showASymbol
                  ? 'scale(1) translateY(0px)'
                  : 'scale(0.88) translateY(10px)',
                filter: showASymbol
                  ? 'blur(0px) drop-shadow(0px 10px 22px rgba(200, 30, 30, 0.15))'
                  : 'blur(5px)',
                willChange: 'opacity, transform, filter',
              }}
            >
              <img
                src={`/logo_a_symbol.png${ASSET_V}`}
                alt="Abhyudaya A with Veena"
                className="w-full h-full object-contain"
                style={{ display: 'block' }}
              />
            </div>
          </div>

          {/* ── SCENE 3+: ABHYUDAYA wordmark reveals below ── */}
          <div
            style={{
              // Wordmark is 390px wide natural, make it match the A symbol width × a multiplier
              width: `calc(${symbolW} * 2.0)`,
              marginTop: '10px',
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), filter 0.7s ease-out',
              opacity: showWordmark ? 1 : 0,
              transform: showWordmark
                ? 'translateY(0px)'
                : 'translateY(12px)',
              filter: showWordmark
                ? 'blur(0px)'
                : 'blur(6px)',
              willChange: 'opacity, transform, filter',
            }}
          >
            <img
              src={`/logo_wordmark.png${ASSET_V}`}
              alt="ABHYUDAYA"
              className="w-full h-auto object-contain"
              style={{ display: 'block' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Nav ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS = ['Home', 'About', 'Gallery', 'Programs', 'Contact']

function Navbar({
  active,
  setActive,
  navbarLogoRef,
  introPhase = 'complete',
  onEnrollNow,
}: {
  active: string
  setActive: (p: string) => void
  navbarLogoRef?: React.RefObject<HTMLDivElement | null>
  introPhase?: 'enter' | 'hold' | 'travel' | 'settle' | 'complete'
  onEnrollNow?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav
      style={{ fontFamily: 'Nunito, sans-serif' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#f0e8f8]' : 'bg-transparent'
        }`}
    >
      <div
        className={`max-w-6xl mx-auto px-4 flex items-center justify-between transition-all duration-300 ${scrolled ? 'py-1 sm:py-1.5' : 'py-2 sm:py-2.5'
          }`}
      >
        {/* Logo */}
        <button onClick={() => setActive('Home')} className="flex items-center group focus:outline-none">
          <div
            ref={navbarLogoRef}
            className="flex flex-col items-center select-none transition-transform duration-200 group-hover:scale-105"
            style={{ minWidth: scrolled ? '90px' : '110px' }}
          >
            {/* Standalone Red A Symbol with Veena */}
            <img
              src={`/logo_a_symbol.png${ASSET_V}`}
              alt="Abhyudaya Emblem"
              className={`w-auto object-contain transition-all duration-300 ${scrolled ? 'h-6 sm:h-7' : 'h-7 sm:h-9'
                } ${introPhase !== 'complete' && introPhase !== 'settle'
                  ? 'opacity-0'
                  : 'opacity-100'
                }`}
              style={{ filter: 'drop-shadow(0px 1px 3px rgba(220, 20, 20, 0.15))' }}
            />
            {/* ABHYUDAYA colorful wordmark - Phase 4 Staggered Blur-to-Sharp Reveal */}
            <div
              className={`transition-all duration-700 ease-out mt-0.5 will-change-transform ${introPhase === 'settle' || introPhase === 'complete'
                ? 'opacity-100 translate-y-0 filter-none'
                : 'opacity-0 translate-y-2 blur-[5px]'
                }`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <img
                src={`/logo_wordmark.png${ASSET_V}`}
                alt="ABHYUDAYA"
                className={`w-auto object-contain ${scrolled ? 'h-2.5 sm:h-3' : 'h-3 sm:h-4'
                  }`}
              />
            </div>
          </div>
        </button>

        {/* Desktop nav - Staggered reveal following logo */}
        <div
          className={`hidden md:flex items-center gap-1 transition-all duration-600 ease-out ${introPhase === 'settle' || introPhase === 'complete'
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2'
            }`}
          style={{ transitionDelay: '120ms' }}
        >
          {NAV_ITEMS.map((item, idx) => (
            <button
              key={item}
              onClick={() => setActive(item)}
              style={{ transitionDelay: `${160 + idx * 40}ms` }}
              className={`rounded-full font-bold transition-all duration-200 ${scrolled ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
                } ${active === item
                  ? 'bg-[#e0d0f8] text-[#5a3a6a] shadow-xs'
                  : 'text-[#6a5a7a] hover:bg-[#f5f0fc] hover:text-[#5a3a6a]'
                }`}
            >
              {item}
            </button>
          ))}
          <button
            onClick={onEnrollNow || (() => setActive('Contact'))}
            style={{ transitionDelay: '380ms' }}
            className={`ml-2 bg-[#b8f0d8] text-[#1a6a45] rounded-full font-black btn-primary shadow-sm hover:bg-[#a0e8c8] transition-all cursor-pointer ${scrolled ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2 text-sm'
              }`}
          >
            Enroll Now
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle Navigation Menu"
          >
            <span className={`block h-0.5 w-5 bg-[#5a3a6a] rounded transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-5 bg-[#5a3a6a] rounded transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-[#5a3a6a] rounded transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden bg-white/95 backdrop-blur-md border-t border-[#e8d8f0] px-4 py-3 flex flex-col gap-1 shadow-lg animate-slide-up"
          style={{ animationDuration: '0.22s' }}
        >
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              onClick={() => { setActive(item); setMenuOpen(false) }}
              className={`px-4 py-2.5 rounded-xl font-bold text-left text-sm transition-all ${active === item ? 'bg-[#e0d0f8] text-[#5a3a6a]' : 'text-[#6a5a7a] hover:bg-[#f5f0fc]'
                }`}
            >
              {item}
            </button>
          ))}
          <button
            onClick={() => {
              if (onEnrollNow) onEnrollNow()
              else setActive('Contact')
              setMenuOpen(false)
            }}
            className="mt-1 px-4 py-2.5 bg-[#b8f0d8] text-[#1a6a45] rounded-xl font-black text-center text-xs shadow-sm cursor-pointer"
          >
            Enroll Now
          </button>
        </div>
      )}
    </nav>
  )
}

// ── Home Page ────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { name: 'Priya', child: 'Mother of Aarav, 4', text: 'Abhyudaya Preschool transformed my shy boy into a confident, curious child. The teachers are like second moms!', avatar: '👩‍💼' },
  { name: 'Meera', child: 'Mother of Ananya, 3', text: 'As a working parent, the caring environment and convenient 9:00 AM to 4:00 PM schedule gives me complete peace of mind. My daughter loves every moment here!', avatar: '👩' },
  { name: 'Sunita', child: 'Mother of Rohan, 5', text: 'The play-based learning approach is outstanding. Rohan learned to read, paint, and make friends — all through fun!', avatar: '👩‍🦱' },
]

function HomePage({ setActive, onEnrollNow }: { setActive: (p: string) => void; onEnrollNow?: () => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'linear-gradient(160deg, #f5f0fd 0%, #e8f5f0 40%, #fdf5e8 100%)' }}>
      {/* Decorations */}
      <Cloud style={{ position: 'absolute', top: 80, left: -20, opacity: 0.8 }} />
      <Cloud style={{ position: 'absolute', top: 120, right: -30, opacity: 0.6 }} />
      <Cloud style={{ position: 'absolute', top: 260, left: '30%', opacity: 0.5 }} />
      <Balloon color="#ffd6b0" style={{ position: 'absolute', top: 100, left: '8%' }} />
      <Balloon color="#e0d0f8" style={{ position: 'absolute', top: 140, right: '12%' }} />
      <Balloon color="#b8f0d8" style={{ position: 'absolute', top: 80, left: '45%' }} />
      <Star color="#f5d86b" size={22} style={{ position: 'absolute', top: 160, left: '22%' }} />
      <Star color="#c8b0e8" size={16} style={{ position: 'absolute', top: 200, right: '25%' }} />
      <Star color="#7ed8a0" size={18} style={{ position: 'absolute', top: 320, left: '60%' }} />
      <Star color="#f4a26b" size={14} style={{ position: 'absolute', top: 250, left: '5%' }} />

      {/* Rainbow arc */}
      <div className="absolute top-0 left-0 right-0 h-2 rainbow-bar" />

      {/* Hero */}
      <div className="relative max-w-6xl mx-auto px-4 pt-28 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="hero-anim-badge inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-xs sm:text-sm font-black text-[#7a5a90] mb-6 shadow-sm border border-[#e0d0f8]">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>🌟 Admissions Open 2026–2027 • SS Nagar, Perumanallur</span>
            </div>
            <h1 className="hero-anim-title text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-4 tracking-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Where Little Minds Begin{' '}
              <span className="rainbow-text">Big Journeys</span>{' '}
              &amp; Shine ✨
            </h1>
            <p className="hero-anim-desc text-base sm:text-lg text-[#6a5a7a] leading-relaxed mb-8" style={{ maxWidth: 480 }}>
              A safe, joyful haven in Perumanallur where tiny explorers discover the world through purposeful play, early creativity, and warm friendships — guided with love every day.
            </p>
            <div className="hero-anim-cta flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setActive('Programs')}
                className="btn-primary px-7 py-3.5 bg-[#5a3a8a] text-white rounded-full text-sm sm:text-base shadow-lg hover:bg-[#4a2a7a] flex items-center gap-2 cursor-pointer"
              >
                <span>🎒 Explore Our Programs</span>
              </button>
              <button
                onClick={onEnrollNow || (() => setActive('Contact'))}
                className="btn-primary px-7 py-3.5 bg-white text-[#5a3a8a] rounded-full text-sm sm:text-base shadow-md border-2 border-[#e0d0f8] hover:bg-[#faf5ff] flex items-center gap-2 cursor-pointer"
              >
                <span>💌 Enquire Now</span>
              </button>
            </div>

            {/* Animated Trust Stats */}
            <div className="hero-anim-stats flex flex-wrap gap-6 mt-10">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <CountUp end={200} suffix="+" />
                </div>
                <div className="text-xs text-[#9a88a8] font-medium">Happy Kids</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <CountUp end={12} suffix="+" />
                </div>
                <div className="text-xs text-[#9a88a8] font-medium">Years of Joy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <CountUp end={20} suffix="+" />
                </div>
                <div className="text-xs text-[#9a88a8] font-medium">Expert Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  9 AM – 4 PM
                </div>
                <div className="text-xs text-[#9a88a8] font-medium">School Timings</div>
              </div>
            </div>
          </div>

          {/* Lotus Image on Right Side of Home Page with logo_transparent.png on top */}
          <div className="hero-anim-mascot relative flex items-center justify-center min-h-[290px] sm:min-h-[340px] md:h-[480px] py-4 sm:py-6 md:py-0 md:pt-10">
            {/* Soft radiant ambient glow behind lotus */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none translate-x-0 md:translate-x-12 lg:translate-x-20 translate-y-0 md:translate-y-12 lg:translate-y-16">
              <div
                className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 230, 240, 0.7) 0%, rgba(224, 208, 248, 0.5) 45%, transparent 70%)',
                  filter: 'blur(25px)',
                }}
              />
            </div>

            <div className="relative max-w-full max-h-full flex flex-col items-center justify-center translate-x-0 md:translate-x-12 lg:translate-x-20 translate-y-0 md:translate-y-8 lg:translate-y-12">
              {/* Logo on top of lotus - bigger & shifted up */}
              <img
                src={`/logo_transparent.png${ASSET_V}`}
                alt="Abhyudaya Logo"
                className="w-56 sm:w-72 md:w-[380px] h-auto object-contain mb-1 sm:mb-2 -translate-y-3 sm:-translate-y-5 md:-translate-y-6 z-10"
                style={{
                  filter: 'drop-shadow(0 6px 16px rgba(180, 40, 40, 0.28))',
                }}
              />

              {/* Lotus flower */}
              <img
                src={`/lotus.png${ASSET_V}`}
                alt="Lotus Illustration"
                className="w-auto h-48 sm:h-64 md:h-[340px] object-contain"
                style={{
                  filter: 'drop-shadow(0 12px 24px rgba(120, 60, 140, 0.15))',
                }}
              />
            </div>
          </div>
        </div>

        {/* Why choose us strip */}
        <ScrollReveal delay={100} className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Why Families Love Abhyudaya 💗
            </h2>
            <p className="text-sm text-[#7a6a8a] mt-1">Carefully designed for your child's happiest first steps</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🛡️', title: 'Safe Campus', color: '#b8f0d8', text: 'CCTV, secure gates & trained staff' },
              { icon: '💗', title: 'Caring Teachers', color: '#ffd6b0', text: 'Nurturing with patience & love' },
              { icon: '🎨', title: 'Activity Learning', color: '#e0d0f8', text: 'Hands-on play-based curriculum' },
              { icon: '⭐', title: 'Individual Care', color: '#b8d8f8', text: 'Every child is truly seen' },
            ].map(({ icon, title, color, text }, idx) => (
              <div
                key={title}
                className="card-hover rounded-2xl p-5 flex flex-col gap-2 shadow-sm border border-white/80 transition-all cursor-default"
                style={{ backgroundColor: color + '80' }}
              >
                <div className="text-3xl">{icon}</div>
                <div className="font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>{title}</div>
                <div className="text-sm text-[#6a5a7a]">{text}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Testimonials */}
        <ScrollReveal delay={150} className="mt-20">
          <h2 className="text-3xl font-black text-center text-[#5a3a8a] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            💬 Words From Our Parents
          </h2>
          <p className="text-center text-[#7a6a8a] text-sm mb-10">Real experiences from our preschool family</p>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, child, text, avatar }) => (
              <div key={name} className="card-hover bg-white rounded-3xl p-6 shadow-sm border border-[#f0e8f8] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{avatar}</div>
                    <div className="text-[#f5a623] text-sm tracking-wide">★★★★★</div>
                  </div>
                  <p className="text-[#5a4a6a] leading-relaxed mb-4 italic text-sm">"{text}"</p>
                </div>
                <div className="pt-2 border-t border-[#f5f0fa]">
                  <div className="font-black text-[#5a3a8a] text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{name}</div>
                  <div className="text-xs text-[#9a88a8]">{child}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Visit CTA */}
        <ScrollReveal delay={200} className="mt-16">
          <div className="rounded-3xl p-10 text-center relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #e0d0f8, #b8f0d8, #ffd6b0)' }}>
            <div className="text-5xl mb-4">🏡</div>
            <h3 className="text-3xl font-black text-[#3d2a50] mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>Schedule a Friendly Campus Visit</h3>
            <p className="text-[#5a4a6a] max-w-lg mx-auto mb-6 text-sm sm:text-base">
              Come see the magic for yourself! Meet our loving educators, explore our clean classrooms, and tour our play facilities between 9:00 AM and 4:00 PM.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={onEnrollNow || (() => setActive('Contact'))}
                className="btn-primary px-8 py-3.5 bg-[#5a3a8a] text-white rounded-full text-base font-black shadow-lg hover:bg-[#4a2a7a] cursor-pointer"
              >
                Book a Free Visit 🎒
              </button>
              <a
                href="https://wa.me/919788713822?text=Hello%20Abhyudaya%20Preschool%2C%20I%20would%20like%20to%20schedule%20a%20visit"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-7 py-3.5 bg-[#25D366] text-white rounded-full text-base font-black shadow-md hover:bg-[#20ba59] flex items-center gap-2 cursor-pointer"
              >
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

// ── About Page ───────────────────────────────────────────────────────────────

function AboutPage() {
  const pillars = [
    { icon: '🔭', title: 'Our Vision', color: '#e0d0f8', desc: 'To be the most cherished early learning community where every child grows into a joyful, confident, and compassionate human being.' },
    { icon: '🎯', title: 'Our Mission', color: '#b8f0d8', desc: 'To nurture curiosity and creativity through play-based learning, ensuring each child feels safe, loved, and celebrated for who they are.' },
  ]
  const values = [
    { icon: '🛡️', title: 'Safe & Secure', color: '#b8d8f8', desc: 'Round-the-clock CCTV, child-safe furniture, secured entry gates and regular safety drills.' },
    { icon: '💛', title: 'Caring Teachers', color: '#fff0b0', desc: 'Our educators are trained in early childhood development and treat every child with warmth, patience and respect.' },
    { icon: '🎮', title: 'Play-Based Learning', color: '#b8f0d8', desc: 'We believe children learn best through play. All activities are designed to spark curiosity naturally.' },
    { icon: '🥗', title: 'Healthy Routine', color: '#ffd6b0', desc: 'Balanced nutrition, rest time, outdoor play and group activities form our thoughtfully designed daily routine.' },
    { icon: '🌈', title: 'Inclusive Environment', color: '#e0d0f8', desc: 'We celebrate diversity and ensure every child — regardless of background — feels a sense of belonging.' },
    { icon: '📚', title: 'Holistic Growth', color: '#ffd8e4', desc: 'Social, emotional, cognitive, and physical development are equally nurtured in our curriculum.' },
  ]
  return (
    <div className="min-h-screen relative overflow-hidden about-page-bg">
      <div className="rainbow-bar h-1.5" />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-14 sm:py-20 relative z-10">
        <ScrollReveal className="text-center mb-10 sm:mb-14">
          <span className="text-5xl inline-block mb-1 sm:mb-2 animate-bounce-soft">🌻</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#5a3a8a] mb-3 sm:mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>About Abhyudaya Preschool</h2>
          <p className="text-sm sm:text-base md:text-lg text-[#6a5a7a] max-w-xl mx-auto font-medium px-2 sm:px-0">Nurturing tiny hearts with love, structure, and wonder in SS Nagar, Perumanallur.</p>
        </ScrollReveal>

        {/* Vision & Mission */}
        <ScrollReveal delay={100} className="grid md:grid-cols-2 gap-6 mb-14">
          {pillars.map(({ icon, title, color, desc }) => (
            <div key={title} className="card-hover rounded-3xl p-8 shadow-sm border border-white" style={{ backgroundColor: color + 'aa' }}>
              <div className="text-5xl mb-4">{icon}</div>
              <h3 className="text-2xl font-black text-[#3d2a50] mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>{title}</h3>
              <p className="text-[#5a4a6a] leading-relaxed">{desc}</p>
            </div>
          ))}
        </ScrollReveal>

        {/* Story */}
        <ScrollReveal delay={150} className="bg-white rounded-3xl p-8 mb-14 shadow-sm border border-[#f0e8f8] flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-shrink-0 animate-float">
            <TeddyMascot size={140} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#5a3a8a] mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>Our Story</h3>
            <p className="text-[#5a4a6a] leading-relaxed mb-3">
              Abhyudaya Preschool was founded with a heartfelt vision — to create a nurturing space where every child feels safe, loved, and inspired to learn. Located in SS Nagar, Avinashi Road, Perumanallur, we welcome children from Daycare age all the way through UKG and beyond.
            </p>
            <p className="text-[#5a4a6a] leading-relaxed">
              Led by Bharani S, our passionate team is dedicated to holistic early childhood development. From joyful play to structured learning, every moment at Abhyudaya is crafted to help your little one bloom. We're not just a school — we're family.
            </p>
          </div>
        </ScrollReveal>

        {/* Values */}
        <ScrollReveal delay={200}>
          <h3 className="text-3xl font-black text-[#5a3a8a] text-center mb-8" style={{ fontFamily: 'Nunito, sans-serif' }}>What Makes Us Special ✨</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mb-16">
            {values.map(({ icon, title, color, desc }) => (
              <div key={title} className="card-hover rounded-2xl p-6 shadow-sm border border-white/80" style={{ backgroundColor: color + '88' }}>
                <div className="text-4xl mb-3">{icon}</div>
                <h4 className="text-lg font-black text-[#3d2a50] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>{title}</h4>
                <p className="text-sm text-[#5a4a6a] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Team */}
        <ScrollReveal delay={250} className="text-center">
          <h3 className="text-3xl font-black text-[#5a3a8a] mb-8" style={{ fontFamily: 'Nunito, sans-serif' }}>Meet Our Educators 💗</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { name: 'Mrs. Bharani', role: 'Founder & Principal', color: '#e0d0f8' },
              { name: 'Ms. Sreelakshmi', role: 'Head Teacher', color: '#b8f0d8' },
              { name: 'Ms. Ananya', role: 'Activity Coordinator', color: '#ffd6b0' },
              { name: 'Mr. Azhagan', role: 'Music & Movement', color: '#b8d8f8' },
            ].map(({ name, role, color }) => (
              <div key={name} className="card-hover bg-white rounded-2xl p-5 shadow-sm border border-[#f0e8f8]">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black text-white shadow-sm" style={{ backgroundColor: color }}>
                  {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="font-black text-[#3d2a50] text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{name}</div>
                <div className="text-xs text-[#9a88a8] mt-0.5">{role}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

// ── Gallery Page ─────────────────────────────────────────────────────────────

const GALLERY_CATS = ['All', 'Classroom', 'Activities', 'Outdoor', 'Mealtime', 'Meditation']

const GALLERY_ITEMS = [
  { cat: 'Classroom', emoji: '🏫', label: 'Our Colourful Classroom', bg: '#ffd6b0', localImg: `/gallery1.jpg${ASSET_V}` },
  { cat: 'Activities', emoji: '💃', label: 'Fun Movement Activity', bg: '#e0d0f8', localImg: `/gallery2.jpg${ASSET_V}` },
  { cat: 'Outdoor', emoji: '🎈', label: 'Balloon Day Celebration', bg: '#b8f0d8', localImg: `/gallery3.jpg${ASSET_V}` },
  { cat: 'Meditation', emoji: '🧘', label: 'Morning Meditation', bg: '#b8d8f8', localImg: `/gallery4.jpg${ASSET_V}` },
  { cat: 'Mealtime', emoji: '🍱', label: 'Snack Time Together', bg: '#ffd8e4', localImg: `/gallery5.jpg${ASSET_V}` },
]

function GalleryPage() {
  const [active, setActive] = useState('All')
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItemData | null>(null)
  const filtered = active === 'All' ? GALLERY_ITEMS : GALLERY_ITEMS.filter(i => i.cat === active)

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(253, 250, 246, 0.65) 40%, rgba(240, 248, 244, 0.8) 100%), url('/rainbow.jpg${ASSET_V}')`,
        backgroundSize: 'contain',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="rainbow-bar h-1.5" />
      <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
        <ScrollReveal className="text-center mb-12">
          <span className="text-5xl">📸</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#5a3a8a] mt-3 mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>Gallery &amp; Activities</h2>
          <p className="text-[#6a5a7a]">Peek into the everyday magic, laughter, and learning at Abhyudaya Preschool</p>
        </ScrollReveal>

        {/* Filter tabs */}
        <ScrollReveal delay={100} className="flex flex-wrap gap-2 justify-center mb-10">
          {GALLERY_CATS.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer ${active === cat ? 'bg-[#5a3a8a] text-white shadow-md' : 'bg-white text-[#5a3a8a] border border-[#e0d0f8] hover:bg-[#f0e8fc]'
                }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {cat}
            </button>
          ))}
        </ScrollReveal>

        {/* Grid */}
        <ScrollReveal delay={150} className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filtered.map(item => (
            <div
              key={item.label}
              onClick={() => setSelectedPhoto(item)}
              className="group relative rounded-3xl overflow-hidden shadow-md border border-white/80 bg-white cursor-pointer card-hover"
            >
              {/* Image */}
              <div className="relative h-60 overflow-hidden" style={{ backgroundColor: item.bg }}>
                <img
                  src={item.localImg}
                  alt={item.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d1a40]/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                  <div>
                    <div className="text-white font-black text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>{item.label}</div>
                    <div className="text-[#e0d0f8] text-xs mt-0.5">{item.cat}</div>
                  </div>
                  <span className="px-3 py-1 bg-white/30 backdrop-blur-md rounded-full text-white text-xs font-bold">🔍 View</span>
                </div>
                {/* Category badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md" style={{ background: 'rgba(90,58,138,0.75)', backdropFilter: 'blur(6px)' }}>
                  {item.emoji} {item.cat}
                </div>
              </div>
              {/* Card footer */}
              <div className="p-4 flex items-center justify-between bg-white border-t border-[#f5f0fc]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <div className="font-black text-[#3d2a50] text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{item.label}</div>
                    <div className="text-xs text-[#9a88a8] mt-0.5">Abhyudaya Preschool</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollReveal>

        {/* Lightbox Modal */}
        <GalleryLightbox
          item={selectedPhoto}
          items={filtered}
          onSelect={setSelectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />

        {/* Instagram Reel embed section */}
        <ScrollReveal delay={200} className="mt-16 bg-white rounded-3xl p-8 shadow-sm border border-[#f0e8f8] text-center">
          <div className="text-4xl mb-3">📱</div>
          <h3 className="text-2xl font-black text-[#5a3a8a] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>Watch Us on Instagram</h3>
          <p className="text-[#6a5a7a] mb-6 text-sm">See reels of our kids dancing, painting, and celebrating every day!</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://www.instagram.com/abhyudayapreschool?igsh=MTFpYmpwejg3OXZxdQ=="
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-black text-sm shadow-md"
              style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              📷 Follow @abhyudayapreschool
            </a>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {['#ffd6b0', '#e0d0f8', '#b8f0d8', '#b8d8f8', '#fff0b0', '#ffd8e4'].map((c, i) => (
              <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: c }}>
                {['🎨', '💃', '🌿', '📖', '🎂', '🎵'][i]}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

// ── Programs Page ─────────────────────────────────────────────────────────────

const TIMETABLE = [
  { time: '9:00 AM', activity: 'Warm Welcome, Morning Circle & Prayers', icon: '🌅' },
  { time: '9:30 AM', activity: 'Rhymes, Phonics & Daily Language Fun', icon: '🎵' },
  { time: '10:15 AM', activity: 'Healthy Snack & Fresh Fruit Break', icon: '🥪' },
  { time: '10:45 AM', activity: 'Activity Block (Drawing, Craft & Sensory Play)', icon: '🎨' },
  { time: '11:45 AM', activity: 'Outdoor Play, Sandpit & Gross Motor Games', icon: '🌿' },
  { time: '12:30 PM', activity: 'Storytelling, Puppet Show & Show-and-Tell', icon: '📖' },
  { time: '1:00 PM', activity: 'Nutritious & Delicious Lunch Time', icon: '🍱' },
  { time: '1:30 PM', activity: 'Rest & Quiet Time / Refreshing Nap', icon: '😴' },
  { time: '2:45 PM', activity: 'Puzzles, Building Blocks & Creative STEM Play', icon: '🧱' },
  { time: '3:30 PM', activity: 'Evening Snack & Joyful Music / Dance Time', icon: '💃' },
  { time: '4:00 PM', activity: 'Review of the Day, Bag Pack & Parent Pickup', icon: '🎒' },
]

const ACTIVITIES = [
  { icon: '🧩', name: 'Puzzle Games' },
  { icon: '🖍️', name: 'Drawing & Coloring' },
  { icon: '📖', name: 'Storytelling' },
  { icon: '🎵', name: 'Rhymes & Dance' },
  { icon: '🧱', name: 'Building Blocks' },
  { icon: '🌱', name: 'Indoor Gardening' },
  { icon: '😴', name: 'Nap Time' },
  { icon: '🍎', name: 'Healthy Snacks' },
  { icon: '🤝', name: 'Group Social Play' },
]

function ProgramsPage({
  setActive,
  onEnrollNow,
}: {
  setActive: (p: string) => void
  onEnrollNow?: () => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const programs = [
    {
      id: 'daycare',
      category: 'daycare',
      name: 'Daycare',
      age: '2+ years',
      icon: '🍼',
      color: '#ffd6b0',
      time: 'Mon–Sat | 9:00 AM – 4:00 PM',
      desc: 'A safe and loving environment for toddlers 2 years and above. Supervised care, play, rest, and meals with gentle, attentive teachers.',
      features: ['Safe & supervised care', 'Age-appropriate play', 'Nutritious meals & snacks', 'Rest & nap time', 'Warm, home-like atmosphere'],
    },
    {
      id: 'playgroup',
      category: 'foundations',
      name: 'Playgroup',
      age: 'Ages 2 – 3 yrs',
      icon: '🎪',
      color: '#e0d0f8',
      time: 'Mon–Sat | 9:00 AM – 12:30 PM / 4:00 PM',
      desc: 'A gentle first step into school life. Sensory play, rhymes, and social bonding in a cosy, home-like setting.',
      features: ['Sensory & tactile play', 'Circle time & songs', 'Basic motor skills', 'Social bonding activities', 'Toilet training support'],
    },
    {
      id: 'nursery',
      category: 'foundations',
      name: 'Nursery',
      age: 'Ages 3 – 4 yrs',
      icon: '🌱',
      color: '#b8f0d8',
      time: 'Mon–Sat | 9:00 AM – 1:00 PM / 4:00 PM',
      desc: 'Building curiosity and creativity through structured play, early language skills, and joyful exploration.',
      features: ['Pre-reading & pre-writing', 'Number concepts & math play', 'Art, craft & music', 'Storytelling sessions', 'Social & emotional skills'],
    },
    {
      id: 'kindergarten',
      category: 'kindergarten',
      name: 'LKG & UKG',
      age: 'Ages 4 – 6 yrs',
      icon: '📚',
      color: '#b8d8f8',
      time: 'Mon–Sat | 9:00 AM – 3:30 PM / 4:00 PM',
      desc: 'Comprehensive kindergarten program preparing children for primary school with academics, creativity, and character building.',
      features: ['Reading & writing readiness', 'Numeracy & math concepts', 'Science exploration', 'Art, craft & outdoor activities', 'School readiness skills'],
    },
    {
      id: 'afterschool',
      category: 'daycare',
      name: 'Afterschool Care',
      age: 'School-going kids',
      icon: '🎒',
      color: '#fff0b0',
      time: 'Mon–Sat | Up to 4:00 PM',
      desc: 'Safe, supervised afterschool care with homework help, activities, and fun — giving working parents peace of mind.',
      features: ['Homework assistance', 'Reading & activity time', 'Healthy snacks', 'Indoor & outdoor games', 'Safe pickup & care'],
    },
    {
      id: 'weekend',
      category: 'weekend',
      name: 'Weekend Care',
      age: 'All ages',
      icon: '🌈',
      color: '#ffd8e4',
      time: 'Weekends | Special Sessions',
      desc: 'Fun-filled weekend sessions with creative activities, games, and learning — giving parents a well-deserved break.',
      features: ['Creative arts & crafts', 'Music & movement', 'Group games & storytelling', 'Structured fun activities', 'Flexible weekend timings'],
    },
  ]

  const filteredPrograms = selectedCategory === 'all'
    ? programs
    : programs.filter(p => p.category === selectedCategory)

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(253, 250, 246, 0.65) 40%, rgba(240, 248, 244, 0.8) 100%), url('/rainbow.jpg${ASSET_V}')`,
        backgroundSize: 'contain',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="rainbow-bar h-1.5" />
      <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
        <ScrollReveal className="text-center mb-10">
          <span className="text-5xl">🎒</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#5a3a8a] mt-3 mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>Our Programs &amp; Curriculum</h2>
          <p className="text-[#6a5a7a] max-w-xl mx-auto">Thoughtfully designed for every stage of your child's early years — from Daycare to UKG and beyond</p>
        </ScrollReveal>

        {/* Program Category Tabs */}
        <ScrollReveal delay={100} className="flex justify-center mb-10">
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-white shadow-sm border border-[#e0d0f8] gap-1">
            {[
              { id: 'all', label: 'All Programs' },
              { id: 'daycare', label: 'Daycare & Afterschool' },
              { id: 'foundations', label: 'Playgroup & Nursery' },
              { id: 'kindergarten', label: 'LKG & UKG' },
              { id: 'weekend', label: 'Weekend Care' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${selectedCategory === tab.id
                  ? 'bg-[#5a3a8a] text-white shadow-sm'
                  : 'text-[#6a5a7a] hover:bg-[#f5f0fc] hover:text-[#5a3a8a]'
                  }`}
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Program cards grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-16">
          {filteredPrograms.map(({ name, age, icon, color, time, desc, features }) => (
            <div
              key={name}
              className="card-hover rounded-3xl overflow-hidden shadow-sm border border-white bg-white flex flex-col justify-between"
            >
              <div>
                <div className="p-6" style={{ backgroundColor: color + 'cc' }}>
                  <div className="text-5xl mb-3">{icon}</div>
                  <h3 className="text-2xl font-black text-[#3d2a50] mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>{name}</h3>
                  <div className="text-sm font-bold text-[#5a4a6a]">{age}</div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 bg-white/70 backdrop-blur-sm rounded-full text-xs font-bold text-[#5a3a7a]">
                    ⏰ {time}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-[#5a4a6a] leading-relaxed mb-4">{desc}</p>
                  <ul className="space-y-2 mb-6">
                    {features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[#5a4a6a]">
                        <span className="text-[#10b981] font-black">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={onEnrollNow || (() => setActive('Contact'))}
                  className="btn-primary w-full py-2.5 px-4 bg-[#f4effc] text-[#5a3a8a] hover:bg-[#5a3a8a] hover:text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#e0d0f8]"
                >
                  <span>Enquire for {name} →</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Working parents banner */}
        <ScrollReveal delay={150} className="rounded-3xl p-8 mb-14 text-center shadow-sm" style={{ background: 'linear-gradient(135deg, #b8f0d8 0%, #e0d0f8 100%)' }}>
          <div className="text-4xl mb-3">💼👩‍💼</div>
          <h3 className="text-2xl font-black text-[#3d2a50] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>We Support Working Parents</h3>
          <p className="text-[#5a4a6a] max-w-xl mx-auto text-sm leading-relaxed">
            Our Daycare, Afterschool, and Weekend Care programs are designed with working parents in mind. Your child is safe, happy, and learning with us — giving you the peace of mind you deserve.
          </p>
          <button
            onClick={onEnrollNow || (() => setActive('Contact'))}
            className="btn-primary mt-6 px-7 py-3 bg-[#5a3a8a] text-white rounded-full font-black text-sm shadow-lg cursor-pointer hover:bg-[#4a2a7a]"
          >
            Enquire About Day Care 📞
          </button>
        </ScrollReveal>

        {/* Engagement activities */}
        <ScrollReveal delay={200}>
          <h3 className="text-3xl font-black text-[#5a3a8a] text-center mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>Engagement Activities 🌈</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3 mb-14">
            {ACTIVITIES.map(({ icon, name }) => (
              <div key={name} className="card-hover bg-white rounded-2xl p-3 text-center shadow-sm border border-[#f0e8f8]">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-bold text-[#5a4a6a]" style={{ fontFamily: 'Nunito, sans-serif' }}>{name}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Timetable */}
        <ScrollReveal delay={250}>
          <div className="text-center mb-6">
            <h3 className="text-3xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>Sample Daily Timetable 📅</h3>
            <p className="text-sm text-[#7a6a8a] mt-1">Structured joy from morning prayer to afternoon review (9:00 AM – 4:00 PM)</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-[#f0e8f8] overflow-hidden">
            {TIMETABLE.map(({ time, activity, icon }, i) => (
              <div
                key={time}
                className="flex items-center gap-4 px-6 py-4 border-b border-[#f5f0fc] last:border-0 hover:bg-[#faf6fd] transition-colors"
                style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fdfaff' }}
              >
                <span className="text-2xl">{icon}</span>
                <span className="w-28 text-sm font-black text-[#9a78b0] shrink-0" style={{ fontFamily: 'Nunito, sans-serif' }}>{time}</span>
                <span className="text-sm text-[#5a4a6a]">{activity}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

// ── Contact Page ─────────────────────────────────────────────────────────────

function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    childName: '',
    childAge: 'Playgroup (2-3 yrs)',
    phone: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [visitForm, setVisitForm] = useState({
    name: '',
    phone: '',
    date: '',
    slot: '10:00 AM – 11:00 AM',
    notes: '',
  })
  const [visitSubmitted, setVisitSubmitted] = useState(false)
  const [visitSubmitting, setVisitSubmitting] = useState(false)
  const [visitError, setVisitError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    const result = await submitEnquiry({
      parent_name: form.name,
      phone: form.phone,
      child_name: form.childName || undefined,
      child_age: form.childAge || undefined,
      message: form.message || undefined,
      enquiry_type: 'admission',
    })
    setSubmitting(false)
    if (result.success) {
      setSubmitted(true)
      setForm({ name: '', childName: '', childAge: 'Playgroup (2-3 yrs)', phone: '', message: '' })
      setTimeout(() => setSubmitted(false), 8000)
    } else {
      setSubmitError(result.error ?? 'Submission failed. Please try again or call us directly.')
    }
  }

  function handleDirectWhatsApp(e: React.FormEvent) {
    e.preventDefault()
    const msg = `Hello Abhyudaya Preschool! 👋
I would like to enquire about admissions:
• Parent Name: ${form.name || 'Parent'}
• Child's Name: ${form.childName || 'Not specified'}
• Program / Age: ${form.childAge}
• Contact Phone: ${form.phone || 'Not specified'}
• Questions/Note: ${form.message || 'Please share admission details and fee structure.'}`
    const url = `https://wa.me/919788713822?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  async function handleVisitSubmit(e: React.FormEvent) {
    e.preventDefault()
    setVisitError('')
    setVisitSubmitting(true)
    const result = await submitCampusVisit({
      parent_name: visitForm.name,
      phone: visitForm.phone,
      preferred_date: visitForm.date || undefined,
      preferred_slot: visitForm.slot || undefined,
      notes: visitForm.notes || undefined,
    })
    setVisitSubmitting(false)
    if (result.success) {
      setVisitSubmitted(true)
      setVisitForm({ name: '', phone: '', date: '', slot: '10:00 AM – 11:00 AM', notes: '' })
      setTimeout(() => setVisitSubmitted(false), 8000)
      // Also open WhatsApp for immediate confirmation
      const msg = `Hello Abhyudaya Preschool! 🏡
I have submitted a campus visit request:
• Parent Name: ${visitForm.name}
• Phone: ${visitForm.phone}
• Preferred Date: ${visitForm.date || 'Flexible'}
• Preferred Time: ${visitForm.slot}
• Notes: ${visitForm.notes || 'Looking forward to touring the classrooms!'}`
      const url = `https://wa.me/919788713822?text=${encodeURIComponent(msg)}`
      window.open(url, '_blank')
    } else {
      setVisitError(result.error ?? 'Could not save your visit request. Please WhatsApp us directly.')
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(253, 250, 246, 0.65) 40%, rgba(240, 248, 244, 0.8) 100%), url('/rainbow.jpg${ASSET_V}')`,
        backgroundSize: 'contain',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="rainbow-bar h-2" />

      {/* Floating background elements */}
      <Cloud style={{ position: 'absolute', top: 90, left: -20, opacity: 0.6 }} />
      <Cloud style={{ position: 'absolute', top: 160, right: -30, opacity: 0.5 }} />
      <Balloon color="#ffd6b0" style={{ position: 'absolute', top: 140, right: '8%' }} />
      <Balloon color="#b8f0d8" style={{ position: 'absolute', top: 220, left: '6%' }} />
      <Star color="#f5d86b" size={20} style={{ position: 'absolute', top: 180, left: '18%' }} />
      <Star color="#c8b0e8" size={16} style={{ position: 'absolute', top: 260, right: '22%' }} />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-20 relative z-10">
        {/* Header */}
        <ScrollReveal direction="down">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-[#7a5a90] mb-4 shadow-sm border border-[#e0d0f8]">
              <span>📍</span> SS Nagar, Avinashi Road, Perumanallur
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#5a3a8a] mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Get in Touch With Us 💬
            </h1>
            <p className="text-base sm:text-lg text-[#6a5a7a] leading-relaxed mb-4">
              We would love to welcome you and your child to Abhyudaya Preschool. Whether you have questions about admissions, want to chat on WhatsApp, or wish to schedule a warm campus tour — we are here for you!
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ffd6b0] to-[#b8f0d8] rounded-full text-xs sm:text-sm font-black text-[#3d2a50] shadow-sm">
              <span>⏰</span> School &amp; Daycare Timings: <strong>9:00 AM – 4:00 PM</strong> (Mon – Sat)
            </div>
          </div>
        </ScrollReveal>

        {/* Quick action bar */}
        <ScrollReveal direction="up" delay={80}>
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center mb-14">
            <a
              href="https://wa.me/919788713822?text=Hello%20Abhyudaya%20Preschool%2C%20I%20would%20like%20to%20enquire%20about%20admissions"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 bg-[#25D366] text-white rounded-full font-black text-base shadow-lg hover:bg-[#20ba5a] transition-all hover:scale-105"
              style={{ boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)' }}
            >
              <WhatsAppIcon size={22} />
              <span>Direct WhatsApp Chat</span>
            </a>
            <a
              href="tel:+919788713822"
              className="btn-primary flex items-center gap-2 px-6 py-3.5 sm:py-4 bg-[#5a3a8a] text-white rounded-full font-black text-sm sm:text-base shadow-lg hover:bg-[#482c70] transition-all"
            >
              <span>📞</span> Call: 97887 13822
            </a>
            <a
              href="tel:04222233822"
              className="btn-primary flex items-center gap-2 px-6 py-3.5 sm:py-4 bg-white text-[#5a3a8a] border-2 border-[#e0d0f8] rounded-full font-black text-sm sm:text-base shadow-md hover:bg-[#f5f0fc] transition-all"
            >
              <span>☎️</span> Landline: 0422 2233822
            </a>
            <a
              href="mailto:abhyudayapreschool@gmail.com"
              className="btn-primary flex items-center gap-2 px-6 py-3.5 sm:py-4 text-white rounded-full font-black text-sm sm:text-base shadow-lg hover:opacity-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              <span>📧</span> Email Us
            </a>
          </div>
        </ScrollReveal>

        {/* 4 Feature Info Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {/* Card 1 */}
          <ScrollReveal direction="up" delay={100}>
            <div className="card-hover h-full bg-white rounded-3xl p-6 shadow-sm border border-[#f0e8f8] flex flex-col justify-between" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fcf7ff 100%)' }}>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#e0d0f8] flex items-center justify-center text-2xl mb-4">
                  📞
                </div>
                <h2 className="text-lg font-black text-[#3d2a50] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>Phone &amp; Contact</h2>
                <div className="space-y-1.5 text-sm text-[#5a4a6a]">
                  <div>
                    <span className="font-bold text-[#5a3a8a]">Mobile:</span>{' '}
                    <a href="tel:+919788713822" className="hover:underline font-bold text-[#2d1a40]">97887 13822</a>
                  </div>
                  <div>
                    <span className="font-bold text-[#5a3a8a]">Landline:</span>{' '}
                    <a href="tel:04222233822" className="hover:underline text-[#2d1a40]">0422 2233822</a>
                  </div>
                  <div className="text-xs text-[#8a7a9a] mt-2">Feel free to call or text anytime.</div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2 */}
          <ScrollReveal direction="up" delay={150}>
            <div className="card-hover h-full bg-white rounded-3xl p-6 shadow-sm border border-[#f0e8f8] flex flex-col justify-between" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0faf5 100%)' }}>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#b8f0d8] flex items-center justify-center text-2xl mb-4">
                  ⏰
                </div>
                <h2 className="text-lg font-black text-[#3d2a50] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>School Timings</h2>
                <div className="space-y-1.5 text-sm text-[#5a4a6a]">
                  <div className="font-black text-xl text-[#1a6a45]">9:00 AM – 4:00 PM</div>
                  <div className="text-xs font-semibold text-[#6a8a7a]">Monday to Saturday</div>
                  <div className="text-xs text-[#8a9a8a] mt-2">
                    Drop-off starts at 9:00 AM. Flexible pickup and campus visit tours from 9:30 AM to 3:30 PM.
                  </div>
                </div>
              </div>
              <div className="mt-4 py-2 px-3 bg-[#b8f0d8]/40 text-[#1a6a45] rounded-xl font-bold text-xs text-center">
                Active Session: 9 AM to 4 PM
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3 */}
          <ScrollReveal direction="up" delay={200}>
            <div className="card-hover h-full bg-white rounded-3xl p-6 shadow-sm border border-[#f0e8f8] flex flex-col justify-between" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fff7ef 100%)' }}>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#ffd6b0] flex items-center justify-center text-2xl mb-4">
                  📍
                </div>
                <h2 className="text-lg font-black text-[#3d2a50] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>Campus Address</h2>
                <p className="text-sm text-[#5a4a6a] leading-relaxed">
                  <strong>Abhyudaya Preschool</strong><br />
                  SS Nagar, Avinashi Road,<br />
                  Perumanallur, Tiruppur
                </p>
                <div className="text-xs text-[#9a887a] mt-2">Convenient access from Avinashi Road with ample parking.</div>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=SS+Nagar+Avinashi+Road+Perumanallur"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#ffd6b0]/50 text-[#8a4a20] hover:bg-[#ffd6b0]/70 rounded-xl font-bold text-xs transition-all"
              >
                🗺️ Open in Google Maps
              </a>
            </div>
          </ScrollReveal>

          {/* Card 4 */}
          <ScrollReveal direction="up" delay={250}>
            <div className="card-hover h-full bg-white rounded-3xl p-6 shadow-sm border border-[#f0e8f8] flex flex-col justify-between" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #eff7ff 100%)' }}>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#b8d8f8] flex items-center justify-center text-2xl mb-4">
                  👤
                </div>
                <h2 className="text-lg font-black text-[#3d2a50] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>Key Contact</h2>
                <div className="text-base font-black text-[#2d4070]">Bharani S</div>
                <div className="text-xs font-semibold text-[#6080a0] mb-2">Director &amp; Administrator</div>
                <div className="text-xs text-[#5a4a6a] break-all">
                  <a href="mailto:abhyudayapreschool@gmail.com" className="hover:underline text-[#3a60a0]">abhyudayapreschool@gmail.com</a>
                </div>
                <div className="text-xs text-[#8a9aa8] mt-2">Personally guiding every parent through our warm admissions process.</div>
              </div>
              <a
                href="https://www.instagram.com/abhyudayapreschool?igsh=MTFpYmpwejg3OXZxdQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#b8d8f8]/40 text-[#2a5090] hover:bg-[#b8d8f8]/60 rounded-xl font-bold text-xs transition-all"
              >
                📷 @abhyudayapreschool
              </a>
            </div>
          </ScrollReveal>
        </div>

        {/* Forms & Interactive Section */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16">
          {/* Main Enquiry Form */}
          <div className="lg:col-span-7">
            <ScrollReveal direction="up" delay={100}>
              <div
                id="enquiry-form"
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#f0e8f8] scroll-mt-24 sm:scroll-mt-28 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs font-bold text-[#9a78b0] uppercase tracking-wider mb-1">Direct Admissions &amp; Enquiries</div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Send an Enquiry 💌
                    </h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#f5efff] flex items-center justify-center text-2xl">
                    🚀
                  </div>
                </div>

                {!dbConfigured && (
                  <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-xs font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Database not yet connected — use WhatsApp or call us directly for fastest response. <a href="tel:+919788713822" className="font-black underline">97887 13822</a></span>
                  </div>
                )}

                {submitted && (
                  <div className="mb-6 p-4 bg-[#b8f0d8] rounded-2xl text-[#1a6a45] font-bold text-sm flex items-center gap-3 border border-[#7ed8a0]" role="alert" aria-live="polite">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <div>Enquiry saved! We will call or WhatsApp you shortly.</div>
                      <div className="text-xs font-normal text-[#2a5a40]">You can also message Bharani S directly at 97887 13822.</div>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-start gap-2" role="alert" aria-live="assertive">
                    <span className="mt-0.5">⚠️</span>
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5a4a6a] uppercase tracking-wider mb-1.5">Parent's Name *</label>
                      <input
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Priya Anand"
                        className="w-full px-4 py-3 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-sm bg-[#fdfaff] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5a4a6a] uppercase tracking-wider mb-1.5">Child's Name</label>
                      <input
                        value={form.childName}
                        onChange={e => setForm({ ...form, childName: e.target.value })}
                        placeholder="e.g. Aarav"
                        className="w-full px-4 py-3 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-sm bg-[#fdfaff] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5a4a6a] uppercase tracking-wider mb-1.5">Program / Age *</label>
                      <select
                        value={form.childAge}
                        onChange={e => setForm({ ...form, childAge: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-sm bg-[#fdfaff] transition-all"
                      >
                        <option value="Daycare (2+ years)">🍼 Daycare (2+ years, 9 AM – 4 PM)</option>
                        <option value="Playgroup (2-3 yrs)">🎪 Playgroup (Ages 2 – 3 yrs)</option>
                        <option value="Nursery (3-4 yrs)">🌱 Nursery (Ages 3 – 4 yrs)</option>
                        <option value="LKG & UKG (4-6 yrs)">📚 LKG &amp; UKG (Ages 4 – 6 yrs)</option>
                        <option value="Afterschool Care">🎒 Afterschool Care</option>
                        <option value="Weekend Care">🌈 Weekend Care</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5a4a6a] uppercase tracking-wider mb-1.5">Phone Number *</label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 97887 13822"
                        className="w-full px-4 py-3 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-sm bg-[#fdfaff] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5a4a6a] uppercase tracking-wider mb-1.5">Your Message / Questions</label>
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="Ask about admissions, fees, transportation, nutrition, or timings (9 AM – 4 PM)..."
                      className="w-full px-4 py-3 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-sm bg-[#fdfaff] resize-none transition-all"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      aria-disabled={submitting}
                      className="btn-primary w-full py-3.5 px-4 bg-[#5a3a8a] text-white rounded-xl font-black text-sm shadow-md hover:bg-[#4a2a7a] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {submitting ? (
                        <><span className="animate-spin inline-block">⏳</span> Saving…</>
                      ) : (
                        <span>Send Enquiry 🚀</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleDirectWhatsApp}
                      className="btn-primary w-full py-3 px-4 bg-[#25D366] text-white rounded-xl font-black text-sm shadow-sm hover:bg-[#20ba5a] flex items-center justify-center gap-2 transition-all"
                    >
                      <span>💬 Quick WhatsApp instead</span>
                    </button>
                  </div>
                  <p className="text-center text-xs text-[#8a7a9a] pt-1">
                    Or call Bharani S directly at <a href="tel:+919788713822" className="text-[#5a3a8a] font-bold underline">97887 13822</a>.
                  </p>
                </form>
              </div>
            </ScrollReveal>
          </div>

          {/* Schedule Visit & Map */}
          <div className="lg:col-span-5 space-y-6">
            {/* Schedule a Visit */}
            <ScrollReveal direction="up" delay={200}>
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#f0e8f8]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#b8f0d8] flex items-center justify-center text-xl">
                    🏡
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#3d2a50]" style={{ fontFamily: 'Nunito, sans-serif' }}>Book a Campus Tour</h3>
                    <p className="text-xs text-[#6a5a7a]">Visit during school hours (9:00 AM to 4:00 PM)</p>
                  </div>
                </div>

                {visitSubmitted && (
                  <div className="mb-4 p-3.5 bg-[#b8f0d8] rounded-xl text-[#1a6a45] font-bold text-xs flex items-center gap-2 border border-[#7ed8a0]" role="alert" aria-live="polite">
                    <span>✅</span> Visit saved! Opening WhatsApp to confirm your slot with Bharani S.
                  </div>
                )}

                {visitError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-start gap-1.5" role="alert" aria-live="assertive">
                    <span>⚠️</span>
                    <span>{visitError}</span>
                  </div>
                )}

                <form onSubmit={handleVisitSubmit} className="space-y-3">
                  <input
                    required
                    value={visitForm.name}
                    onChange={e => setVisitForm({ ...visitForm, name: e.target.value })}
                    placeholder="Your Name *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-xs sm:text-sm bg-[#fdfaff] transition-all"
                  />
                  <input
                    required
                    type="tel"
                    value={visitForm.phone}
                    onChange={e => setVisitForm({ ...visitForm, phone: e.target.value })}
                    placeholder="Phone / WhatsApp Number *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-xs sm:text-sm bg-[#fdfaff] transition-all"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      type="date"
                      value={visitForm.date}
                      onChange={e => setVisitForm({ ...visitForm, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-xs bg-[#fdfaff] transition-all"
                    />
                    <select
                      value={visitForm.slot}
                      onChange={e => setVisitForm({ ...visitForm, slot: e.target.value })}
                      className="w-full px-2 py-2.5 rounded-xl border border-[#e0d0f8] focus:outline-none focus:ring-2 focus:ring-[#b48de8] text-xs bg-[#fdfaff] transition-all"
                    >
                      <option value="9:30 AM – 10:30 AM">9:30 AM – 10:30 AM</option>
                      <option value="10:30 AM – 11:30 AM">10:30 AM – 11:30 AM</option>
                      <option value="11:30 AM – 12:30 PM">11:30 AM – 12:30 PM</option>
                      <option value="2:00 PM – 3:00 PM">2:00 PM – 3:00 PM</option>
                      <option value="3:00 PM – 4:00 PM">3:00 PM – 4:00 PM</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={visitSubmitting}
                    aria-disabled={visitSubmitting}
                    className="btn-primary w-full py-3 bg-[#b8f0d8] text-[#1a6a45] rounded-xl font-black text-sm shadow-sm border border-[#7ed8a0] hover:bg-[#a3e8c7] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {visitSubmitting ? (
                      <><span className="animate-spin inline-block">⏳</span> Saving…</>
                    ) : (
                      <span>Book Free Visit 🎒</span>
                    )}
                  </button>
                </form>
              </div>
            </ScrollReveal>

            {/* Map & Direction card */}
            <ScrollReveal direction="up" delay={260}>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#f0e8f8]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🗺️</span>
                    <h3 className="font-black text-[#3d2a50] text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>Location &amp; Directions</h3>
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=SS+Nagar+Avinashi+Road+Perumanallur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#5a3a8a] hover:underline"
                  >
                    Full Map ↗
                  </a>
                </div>

                {/* Map Embed preview */}
                <div className="rounded-2xl overflow-hidden shadow-inner border border-[#e0d0f8] mb-3 relative aspect-video bg-[#f0e8fc]">
                  <iframe
                    title="Abhyudaya Preschool Location Map"
                    src="https://maps.google.com/maps?q=SS+Nagar,+Avinashi+Road,+Perumanallur,+Tiruppur&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#6a5a7a]">
                  <span>📍 SS Nagar, Avinashi Road, Perumanallur</span>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=SS+Nagar+Avinashi+Road+Perumanallur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#1a6a45] bg-[#b8f0d8] px-2.5 py-1 rounded-lg hover:bg-[#9ee2c0]"
                  >
                    Get Directions
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* FAQs */}
        <ScrollReveal direction="up">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#f0e8f8]">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="text-xs font-bold text-[#9a78b0] uppercase tracking-wider mb-2">Got Questions?</div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#5a3a8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Frequently Asked Questions ❓
              </h2>
              <p className="text-xs sm:text-sm text-[#7a6a8a] mt-1">Clear answers to help you feel completely confident in your choice.</p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion defaultValue={['faq-1']} className="space-y-3">
                <AccordionItem value="faq-1" className="border border-[#f0e8f8] bg-[#fdfaff] rounded-2xl px-5 sm:px-6 transition-all duration-200">
                  <AccordionTrigger className="text-left font-black text-[#3d2a50] text-base hover:no-underline py-4">
                    ⏰ What are the school &amp; daycare timings?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#6a5a7a] leading-relaxed pb-4">
                    Our campus operates from <strong>9:00 AM to 4:00 PM</strong>, Monday through Saturday. We offer flexible sessions for Playgroup, Nursery, LKG, UKG, and full-day daycare with drop-offs starting at 9:00 AM.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2" className="border border-[#f0e8f8] bg-[#fdfaff] rounded-2xl px-5 sm:px-6 transition-all duration-200">
                  <AccordionTrigger className="text-left font-black text-[#3d2a50] text-base hover:no-underline py-4">
                    💬 Can I contact directly via WhatsApp?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#6a5a7a] leading-relaxed pb-4">
                    Yes! Click any WhatsApp button on our website or text/call <a href="https://wa.me/919788713822" target="_blank" rel="noopener noreferrer" className="font-bold text-[#25D366] hover:underline">97887 13822</a>. Our WhatsApp is active <strong>24/7</strong> for enquiries, and Bharani S and our team respond promptly.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3" className="border border-[#f0e8f8] bg-[#fdfaff] rounded-2xl px-5 sm:px-6 transition-all duration-200">
                  <AccordionTrigger className="text-left font-black text-[#3d2a50] text-base hover:no-underline py-4">
                    🎒 What age groups are eligible?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#6a5a7a] leading-relaxed pb-4">
                    We accept children from <strong>2 years and above</strong> across Daycare, Playgroup, Nursery, LKG, and UKG, plus afterschool support and weekend care.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4" className="border border-[#f0e8f8] bg-[#fdfaff] rounded-2xl px-5 sm:px-6 transition-all duration-200">
                  <AccordionTrigger className="text-left font-black text-[#3d2a50] text-base hover:no-underline py-4">
                    🛡️ Can parents visit the school before joining?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#6a5a7a] leading-relaxed pb-4">
                    Absolutely! We warmly welcome parents to tour our clean, CCTV-monitored classrooms, see the play area, and meet our teachers between 9:30 AM and 3:30 PM. Use the form above to book your preferred visit slot!
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

// ── Footer ───────────────────────────────────────────────────────────────────

function Footer({
  setActive,
  onEnrollNow,
}: {
  setActive: (p: string) => void
  onEnrollNow?: () => void
}) {
  return (
    <footer className="bg-[#2d1a40] text-white py-14 px-4 border-t border-[#4a3060]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={`/logo_transparent.png${ASSET_V}`}
                alt="Abhyudaya Preschool Logo"
                className="h-20 w-auto object-contain"
                style={{ filter: 'drop-shadow(0px 1px 6px rgba(255,255,255,0.25))' }}
              />
            </div>
            <p className="text-sm text-[#b0a0c0] leading-relaxed mb-4">
              Nurturing little minds with love, play, and purpose in SS Nagar, Perumanallur.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4a3060] text-xs font-bold text-[#e0d0f8]">
              ⏰ Timings: 9:00 AM – 4:00 PM
            </div>
          </div>

          <div>
            <h3 className="font-black mb-3 text-[#e0d0f8] text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>Quick Links</h3>
            <ul className="space-y-2 text-sm text-[#b0a0c0]">
              {NAV_ITEMS.map(item => (
                <li key={item}>
                  <button onClick={() => setActive(item)} className="hover:text-white transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-black mb-3 text-[#e0d0f8] text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>Our Programs</h3>
            <ul className="space-y-2 text-sm text-[#b0a0c0]">
              <li>🍼 Daycare (2+ years | 9 AM – 4 PM)</li>
              <li>🎪 Playgroup</li>
              <li>🌱 Nursery</li>
              <li>📚 LKG &amp; UKG</li>
              <li>🎒 Afterschool Care</li>
              <li>🌈 Weekend Care</li>
            </ul>
          </div>

          <div>
            <h3 className="font-black mb-3 text-[#e0d0f8] text-base" style={{ fontFamily: 'Nunito, sans-serif' }}>Contact Us</h3>
            <ul className="space-y-2 text-sm text-[#b0a0c0]">
              <li>
                <a href="tel:+919788713822" className="hover:text-white flex items-center gap-2">
                  <span>📞</span> 97887 13822
                </a>
              </li>
              <li>
                <a href="tel:04222233822" className="hover:text-white flex items-center gap-2">
                  <span>☎️</span> 0422 2233822
                </a>
              </li>
              <li>
                <a href="mailto:abhyudayapreschool@gmail.com" className="hover:text-white flex items-center gap-2 break-all">
                  <span>📧</span> abhyudayapreschool@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span>📍</span> <span>SS Nagar, Avinashi Road, Perumanallur</span>
              </li>
              <li className="flex items-center gap-2">
                <span>👤</span> <strong>Bharani S</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#4a3060] pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#8a7a9a]">
          <span>© 2026 Abhyudaya Preschool. Made with 💗 for little ones.</span>
          <div className="flex gap-4">
            <span>Hours: 9:00 AM – 4:00 PM</span>
            <span>•</span>
            <button
              onClick={onEnrollNow || (() => setActive('Contact'))}
              className="hover:text-white underline cursor-pointer"
            >
              Enroll Now
            </button>
            <span>•</span>
            <button
              onClick={() => setActive('Admin')}
              className="hover:text-[#c0b0d0] cursor-pointer opacity-40 hover:opacity-70 transition-opacity"
              title="Admin Portal"
            >
              Admin
            </button>
          </div>
        </div>

      </div>
    </footer>
  )
}

// ── Top Reading Scroll Progress Bar ──────────────────────────────────────────

function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100
        setProgress(Math.min(100, Math.max(0, currentProgress)))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="scroll-progress-line"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  )
}

// ── Floating WhatsApp ────────────────────────────────────────────────────────

function FloatingWhatsApp() {
  return (
    <aside aria-label="WhatsApp Contact" className="fixed bottom-6 right-6 z-50">
      <a
        href="https://wa.me/919788713822?text=Hello%20Abhyudaya%20Preschool%2C%20I%20would%20like%20to%20enquire%20about%20admissions"
        target="_blank"
        rel="noopener noreferrer"
        title="Chat on WhatsApp (97887 13822)"
        aria-label="Direct WhatsApp Contact - 97887 13822"
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-200"
        style={{ boxShadow: '0 6px 20px rgba(37, 211, 102, 0.45)' }}
      >
        <WhatsAppIcon size={28} />
      </a>
    </aside>
  )
}

// ── App shell ────────────────────────────────────────────────────────────────

// Lazy-load admin to keep main bundle small
const AdminPage = lazy(() => import('./components/AdminPage'))

const PAGES: Record<string, (props: { setActive: (p: string) => void; onEnrollNow: () => void }) => React.ReactElement> = {
  Home: ({ setActive }) => <HomePage setActive={setActive} />,
  About: () => <AboutPage />,
  Gallery: () => <GalleryPage />,
  Programs: ({ setActive, onEnrollNow }) => <ProgramsPage setActive={setActive} onEnrollNow={onEnrollNow} />,
  Contact: () => <ContactPage />,
  Admin: () => (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-3xl animate-pulse">⏳</span></div>}>
      <AdminPage />
    </Suspense>
  ),
}

export default function App() {
  const [active, setActive] = useState('Home')
  const topRef = useRef<HTMLDivElement>(null)
  const navbarLogoRef = useRef<HTMLDivElement>(null)
  const [introPhase, setIntroPhase] = useState<'enter' | 'hold' | 'travel' | 'settle' | 'complete'>('enter')

  function scrollToEnquiry() {
    const el = document.getElementById('enquiry-form')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const firstInput = el.querySelector<HTMLInputElement>('input')
      if (firstInput) {
        setTimeout(() => firstInput.focus({ preventScroll: true }), 400)
      }
    }
  }

  function handleEnrollNow() {
    if (active === 'Contact') {
      scrollToEnquiry()
    } else {
      setActive('Contact')
      // Wait for ContactPage to mount in DOM, then scroll directly to the enquiry form
      requestAnimationFrame(() => {
        setTimeout(scrollToEnquiry, 80)
      })
    }
  }

  function navigate(page: string) {
    setActive(page)
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const Page = PAGES[active]

  return (
    <div ref={topRef} style={{ fontFamily: 'Poppins, sans-serif' }}>
      <ScrollProgressBar />
      <LogoIntroOverlay
        navbarLogoRef={navbarLogoRef}
        introPhase={introPhase}
        setIntroPhase={setIntroPhase}
      />
      <Navbar
        active={active}
        setActive={navigate}
        navbarLogoRef={navbarLogoRef}
        introPhase={introPhase}
        onEnrollNow={handleEnrollNow}
      />
      <Page setActive={navigate} onEnrollNow={handleEnrollNow} />
      <Footer setActive={navigate} onEnrollNow={handleEnrollNow} />
      <FloatingWhatsApp />
    </div>
  )
}
