import { useEffect } from 'react'

export interface GalleryItemData {
  cat: string
  emoji: string
  label: string
  bg: string
  localImg: string
  desc?: string
}

interface GalleryLightboxProps {
  item: GalleryItemData | null
  items?: GalleryItemData[]
  onSelect?: (item: GalleryItemData) => void
  onClose: () => void
}

export function GalleryLightbox({ item, items = [], onSelect, onClose }: GalleryLightboxProps) {
  useEffect(() => {
    if (!item) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' && items.length > 1 && onSelect) {
        const currentIndex = items.findIndex(i => i.label === item.label)
        const nextIndex = (currentIndex + 1) % items.length
        onSelect(items[nextIndex])
      } else if (e.key === 'ArrowLeft' && items.length > 1 && onSelect) {
        const currentIndex = items.findIndex(i => i.label === item.label)
        const prevIndex = (currentIndex - 1 + items.length) % items.length
        onSelect(items[prevIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [item, items, onSelect, onClose])

  if (!item) return null

  const currentIndex = items.findIndex(i => i.label === item.label)
  const hasMultiple = items.length > 1 && !!onSelect

  function handlePrev(e: React.MouseEvent) {
    e.stopPropagation()
    if (!hasMultiple || !onSelect) return
    const prevIndex = (currentIndex - 1 + items.length) % items.length
    onSelect(items[prevIndex])
  }

  function handleNext(e: React.MouseEvent) {
    e.stopPropagation()
    if (!hasMultiple || !onSelect) return
    const nextIndex = (currentIndex + 1) % items.length
    onSelect(items[nextIndex])
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.label}
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-6 bg-black/92 backdrop-blur-md transition-opacity duration-200 animate-fade-in select-none"
    >
      {/* Top Floating Close Button */}
      <button
        onClick={onClose}
        aria-label="Close photo modal"
        className="fixed top-3 right-3 sm:top-6 sm:right-6 z-[130] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 text-white hover:bg-white/35 flex items-center justify-center text-lg sm:text-xl backdrop-blur-md border border-white/20 transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95"
      >
        ✕
      </button>

      {/* Prev arrow button */}
      {hasMultiple && (
        <button
          onClick={handlePrev}
          aria-label="Previous photo"
          className="fixed left-2 sm:left-6 z-[130] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 text-white hover:bg-white/30 flex items-center justify-center text-lg sm:text-xl backdrop-blur-md border border-white/20 transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95"
        >
          ‹
        </button>
      )}

      {/* Next arrow button */}
      {hasMultiple && (
        <button
          onClick={handleNext}
          aria-label="Next photo"
          className="fixed right-2 sm:right-6 z-[130] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 text-white hover:bg-white/30 flex items-center justify-center text-lg sm:text-xl backdrop-blur-md border border-white/20 transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95"
        >
          ›
        </button>
      )}

      {/* Photo Container — Zero unnecessary white spaces, showing image fully at natural aspect ratio */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative max-w-full max-h-full flex flex-col items-center justify-center animate-scale-in"
      >
        <img
          src={item.localImg}
          alt={item.label}
          className="max-h-[82vh] sm:max-h-[86vh] max-w-[92vw] sm:max-w-[88vw] w-auto h-auto object-contain rounded-2xl shadow-2xl ring-1 ring-white/15 pointer-events-auto"
        />

        {/* Floating minimal frosted caption pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[92%] px-4 py-2 bg-black/65 backdrop-blur-md rounded-full border border-white/20 text-white flex items-center gap-2.5 shadow-2xl pointer-events-none">
          <span className="text-base sm:text-lg">{item.emoji}</span>
          <div className="text-xs sm:text-sm font-bold truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {item.label}
          </div>
          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/90 font-medium">
            {item.cat}
          </span>
          {hasMultiple && (
            <span className="text-[10px] sm:text-xs text-white/60 ml-1">
              {currentIndex + 1} / {items.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
