"use client"

import { useState, useEffect } from "react"

interface InteractiveGridBackgroundProps {
  rows?: number
  cols?: number
  className?: string
}

export function InteractiveGridBackground({ rows = 6, cols = 8, className = "" }: InteractiveGridBackgroundProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [fadingCells, setFadingCells] = useState<Set<string>>(new Set())

  const handleMouseEnter = (cellId: string) => {
    setHoveredCell(cellId)
    setFadingCells((prev) => {
      const newSet = new Set(prev)
      newSet.delete(cellId)
      return newSet
    })
  }

  const handleMouseLeave = (cellId: string) => {
    setHoveredCell(null)
    setFadingCells((prev) => new Set(prev).add(cellId))

    setTimeout(() => {
      setFadingCells((prev) => {
        const newSet = new Set(prev)
        newSet.delete(cellId)
        return newSet
      })
    }, 500)
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      <div
        className="w-full h-full grid gap-0"
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: rows }).map((_, rowIndex) =>
          Array.from({ length: cols }).map((_, colIndex) => {
            const cellId = `${rowIndex}-${colIndex}`
            const isHovered = hoveredCell === cellId
            const isFading = fadingCells.has(cellId)

            return (
              <div
                key={cellId}
                onMouseEnter={() => handleMouseEnter(cellId)}
                onMouseLeave={() => handleMouseLeave(cellId)}
                className={`
                  border border-gray-100/50 
                  transition-all duration-500 ease-out
                  ${isHovered ? "bg-primary-100 border-primary-200" : ""}
                  ${isFading ? "bg-primary-50/50" : ""}
                  ${!isHovered && !isFading ? "bg-white" : ""}
                `}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
