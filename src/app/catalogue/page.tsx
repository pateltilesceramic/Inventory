"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { 
  BookOpen, Download, Plus, Trash2, Eye, ArrowLeft, Edit3,
  QrCode, Sparkles, Check, ExternalLink, Printer, FileText, 
  Layers, RefreshCw, Grid, Image as ImageIcon, ChevronRight, ChevronUp, ChevronDown, Phone, 
  MapPin, Mail, Globe, Upload, X, ShieldCheck, Search, Filter 
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { 
  getInventory, 
  getCatalogueDesigns, 
  reorderCatalogueDesigns, 
  addCatalogueDesign, 
  updateCatalogueDesign, 
  deleteCatalogueDesign 
} from "@/lib/actions"

// --- Catalogue Category Presets ---
const CATALOGUE_CATEGORIES = [
  { id: "all", name: "Master Collection", subtitle: "PREMIUM COLLECTION 2026", sizeText: "ALL TILES & SANITARY" },
  { id: "flooring", name: "Flooring Tiles", subtitle: "PREMIUM TILES COLLECTION 2026", sizeText: "FLOOR TILES" },
  { id: "bathroom", name: "Bathroom Tiles", subtitle: "LUXURY BATHROOM TILES 2026", sizeText: "BATHROOM TILES" },
  { id: "parking", name: "Parking Tiles", subtitle: "HEAVY DUTY PARKING TILES 2026", sizeText: "PARKING TILES" },
  { id: "pooja", name: "Pooja Room Tiles", subtitle: "POOJA ROOM DECORATIVE TILES 2026", sizeText: "POOJA ROOM TILES" },
  { id: "elevation", name: "Elevation Tiles", subtitle: "EXTERIOR ELEVATION TILES 2026", sizeText: "ELEVATION TILES" },
  { id: "one-piece", name: "One Piece", subtitle: "PREMIUM ONE PIECE 2026", sizeText: "ONE PIECE" },
]

// --- Catalogue Item Interface ---
interface CatalogueItem {
  id: string
  category: string
  name: string
  code: string
  size: string
  finish: string
  facesCount: number
  faces: string[]
  qrImage: string | null
  qrUrl?: string | null
}

// --- Helper: Default Initial Collection ---
const DEFAULT_CATALOGUE_ITEMS: CatalogueItem[] = [
  {
    id: "1",
    category: "flooring",
    name: "ASTEROID WHITE",
    code: "ST-101",
    size: "600x1200 mm",
    finish: "HIGH GLOSSY",
    facesCount: 4,
    faces: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80"
    ],
    qrImage: "",
    qrUrl: ""
  },
  {
    id: "2",
    category: "flooring",
    name: "AMAZONE BEIGE",
    code: "ST-102",
    size: "600x1200 mm",
    finish: "GLOSSY",
    facesCount: 4,
    faces: [
      "https://images.unsplash.com/photo-1595878715977-2e8f8df18ea8?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1595878715977-2e8f8df18ea8?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1595878715977-2e8f8df18ea8?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1595878715977-2e8f8df18ea8?auto=format&fit=crop&w=600&q=80"
    ],
    qrImage: ""
  },
  {
    id: "3",
    category: "bathroom",
    name: "CHILLON GREY",
    code: "ST-103",
    size: "600x1200 mm",
    finish: "GLOSSY",
    facesCount: 4,
    faces: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"
    ],
    qrImage: ""
  },
  {
    id: "4",
    category: "flooring",
    name: "BIREZA BEIGE",
    code: "ST-104",
    size: "600x1200 mm",
    finish: "GLOSSY",
    facesCount: 6,
    faces: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80"
    ],
    qrImage: ""
  },
  {
    id: "5",
    category: "pooja",
    name: "WD-101",
    code: "WD-101",
    size: "600x1200 mm",
    finish: "MATT",
    facesCount: 4,
    faces: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80"
    ],
    qrImage: ""
  },
  {
    id: "6",
    category: "elevation",
    name: "CERRALD GOLD",
    code: "ST-110",
    size: "600x1200 mm",
    finish: "HIGH GLOSSY",
    facesCount: 4,
    faces: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80"
    ],
    qrImage: ""
  }
]

export default function CatalogueStudioPage() {
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load items from D1 Database
    const loadItems = async () => {
      try {

        const designs = await getCatalogueDesigns()
        if (designs && designs.length > 0) {
          // Parse the JSON faces string back to array
          const parsedDesigns = designs.map((d: any) => ({
            ...d,
            faces: JSON.parse(d.faces as string) as string[]
          }))
          setItems(parsedDesigns)
        } else {
          setItems(DEFAULT_CATALOGUE_ITEMS)
        }
      } catch (err) {
        console.error("Failed to load catalogue designs from DB", err)
        setItems(DEFAULT_CATALOGUE_ITEMS)
      } finally {
        setIsLoading(false)
      }
    }
    loadItems()
  }, [])


  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTheme, setActiveTheme] = useState<"dark" | "light">("dark")
  const [catalogTitle, setCatalogTitle] = useState("PATEL TILES & CERAMIC")
  const [catalogSubtitle, setCatalogSubtitle] = useState("PREMIUM TILES COLLECTION 2026")
  const [tileSizeText, setTileSizeText] = useState("FLOOR TILES")

  // Modal & Inventory Auto-suggestions State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTileId, setEditingTileId] = useState<string | null>(null)
  const [inventoryList, setInventoryList] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingQR, setIsUploadingQR] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [draggedTileId, setDraggedTileId] = useState<string | null>(null)

  // Move tile up in order
  const handleMoveTileUp = async (e: React.MouseEvent, tileId: string) => {
    e.stopPropagation()
    const idx = items.findIndex(item => item.id === tileId)
    if (idx <= 0) return
    
    const updated = [...items]
    const temp = updated[idx]
    updated[idx] = updated[idx - 1]
    updated[idx - 1] = temp
    
    setItems(updated)

    await reorderCatalogueDesigns(updated.map(i => i.id))
  }

  // Move tile down in order
  const handleMoveTileDown = async (e: React.MouseEvent, tileId: string) => {
    e.stopPropagation()
    const idx = items.findIndex(item => item.id === tileId)
    if (idx < 0 || idx >= items.length - 1) return
    
    const updated = [...items]
    const temp = updated[idx]
    updated[idx] = updated[idx + 1]
    updated[idx + 1] = temp
    
    setItems(updated)

    await reorderCatalogueDesigns(updated.map(i => i.id))
  }

  // Handle Drag and Drop swapping
  const handleDragStart = (e: React.DragEvent, tileId: string) => {
    setDraggedTileId(tileId)
    e.dataTransfer.setData("text/plain", tileId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetTileId: string) => {
    e.preventDefault()
    const sourceId = draggedTileId || e.dataTransfer.getData("text/plain")
    if (!sourceId || sourceId === targetTileId) return

    const sourceIdx = items.findIndex(item => item.id === sourceId)
    const targetIdx = items.findIndex(item => item.id === targetTileId)
    if (sourceIdx < 0 || targetIdx < 0) return
    
    const updated = [...items]
    const [movedItem] = updated.splice(sourceIdx, 1)
    updated.splice(targetIdx, 0, movedItem)
    
    setItems(updated)

    await reorderCatalogueDesigns(updated.map(i => i.id))
    setDraggedTileId(null)
  }

  // New / Edit Tile Form State
  const [newTile, setNewTile] = useState({
    name: "",
    category: "flooring",
    code: "",
    size: "600x1200 mm",
    thickness: "",
    finish: "HIGH GLOSSY",
    facesCount: "4",
    faces: [] as string[],
    qrImage: "",
    qrUrl: "",
    featureIcons: [] as string[]
  })
  const [isCustomFinish, setIsCustomFinish] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load inventory list for name suggestions
    getInventory().then((res: any) => {
      if (res?.items) setInventoryList(res.items)
    }).catch(() => {})
  }, [])

  // Open Edit Modal for a tile design
  const handleEditTile = (tile: any) => {
    setEditingTileId(tile.id)
    
    let featureIcons: string[] = []
    let actualFinish = tile.finish || "HIGH GLOSSY"
    if (tile.category === "one-piece") {
      try {
        featureIcons = JSON.parse(tile.finish)
        if (!Array.isArray(featureIcons)) featureIcons = []
      } catch (e) {
        featureIcons = []
      }
      actualFinish = "" // Not used for one-piece
    }

    let actualSize = tile.size || "600x1200 mm"
    let actualThickness = ""
    if (actualSize.includes(" | ")) {
      const parts = actualSize.split(" | ")
      actualSize = parts[0]
      actualThickness = parts[1] || ""
    }

    setIsCustomFinish(false)
    if (actualFinish && !["HIGH GLOSSY", "GLOSSY", "MATT", "CARVING", "INKY", "SPECIAL COLORS"].includes(actualFinish.toUpperCase())) {
      setIsCustomFinish(true)
    }

    setNewTile({
      name: tile.name || "",
      category: tile.category || "flooring",
      code: tile.code || "",
      size: actualSize,
      thickness: actualThickness,
      finish: actualFinish,
      facesCount: (tile.facesCount || 4).toString(),
      faces: tile.faces || [],
      qrImage: tile.qrImage || "",
      qrUrl: tile.qrUrl || "",
      featureIcons
    })
    setIsAddModalOpen(true)
  }

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingTileId(null)
    setIsCustomFinish(false)
    setNewTile({ name: "", category: selectedCategory === "all" ? "flooring" : selectedCategory, code: "", size: "600x1200 mm", thickness: "", finish: "HIGH GLOSSY", facesCount: "4", faces: [], qrImage: "", qrUrl: "", featureIcons: [] })
    setIsAddModalOpen(true)
  }

  // Handle Category Switching
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId)
    const preset = CATALOGUE_CATEGORIES.find(c => c.id === catId)
    if (preset) {
      setCatalogSubtitle(preset.subtitle)
      setTileSizeText(preset.sizeText)
    }
  }

  // Filter items by category
  const filteredItems = selectedCategory === "all" 
    ? items 
    : items.filter(item => item.category === selectedCategory || selectedCategory === "all")

  // Dynamic row-based chunking (Max 3 rows per index page to avoid cutoff)
  const MAX_ROWS_PER_PAGE = 3
  const rawIndexPagesChunks: any[][] = []
  let currentPageItems: any[] = []
  let currentRowCount = 0
  let currentFinish = ""
  let itemsInCurrentFinishRow = 0

  filteredItems.forEach((item) => {
    const itemFinish = item.category === 'one-piece' 
      ? "ONE PIECE" 
      : (item.finish || "GLOSSY").toUpperCase()
    
    if (itemFinish !== currentFinish) {
      if (currentRowCount >= MAX_ROWS_PER_PAGE) {
        rawIndexPagesChunks.push(currentPageItems)
        currentPageItems = []
        currentRowCount = 0
      }
      currentFinish = itemFinish
      itemsInCurrentFinishRow = 0
      currentRowCount += 1
    } else {
      if (itemsInCurrentFinishRow === 7) {
        if (currentRowCount >= MAX_ROWS_PER_PAGE) {
          rawIndexPagesChunks.push(currentPageItems)
          currentPageItems = []
          currentRowCount = 1 
          itemsInCurrentFinishRow = 0
        } else {
          currentRowCount += 1
          itemsInCurrentFinishRow = 0
        }
      }
    }

    currentPageItems.push(item)
    itemsInCurrentFinishRow += 1
  })

  if (currentPageItems.length > 0) {
    rawIndexPagesChunks.push(currentPageItems)
  }

  const numIndexPages = Math.max(1, rawIndexPagesChunks.length)

  // Map each item to its exact Detail Page Number (starts after cover page + index pages)
  let globalItemIndex = 0
  const indexPagesChunks = rawIndexPagesChunks.map(chunk => 
    chunk.map(tile => {
      const pNum = numIndexPages + 2 + globalItemIndex
      
      const normalFaces = (tile.faces || []).filter((f: string) => !f.toLowerCase().includes('scene'))
      const sceneFaces = (tile.faces || []).filter((f: string) => f.toLowerCase().includes('scene'))
      const hasScene = sceneFaces.length > 0
      
      const res = { 
        ...tile, 
        pageNum: pNum, 
        hasScene, 
        scenePageNum: hasScene ? pNum + 1 : undefined,
        normalFaces,
        sceneFaces 
      }
      globalItemIndex += hasScene ? 2 : 1
      return res
    })
  )

  // Flattened for the detail pages loop later
  const itemsWithPageNum = indexPagesChunks.flat()

  // Filter inventory suggestions based on typed input
  const suggestions = newTile.name.trim()
    ? inventoryList.filter(inv => inv.name.toLowerCase().includes(newTile.name.toLowerCase()))
    : []

  // Select a suggestion from the dropdown
  const handleSelectSuggestion = (invItem: any) => {
    setNewTile(prev => ({
      ...prev,
      name: invItem.name.toUpperCase(),
      size: invItem.size || "600x1200 mm",
      thickness: "",
      finish: (invItem.type || "HIGH GLOSSY").toUpperCase(),
      faces: invItem.designUrl && !prev.faces.includes(invItem.designUrl)
        ? [...prev.faces, invItem.designUrl]
        : prev.faces
    }))
    setShowSuggestions(false)
  }

  // Handle uploading multiple image face files
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const uploadedUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|heic)$/i.test(file.name)
      if (!isImage) {
        alert(`File ${file.name} is not recognized as a valid image.`)
        continue
      }

        try {
          const formData = new FormData()
          formData.append("file", file)
  
          const res = await fetch("/api/upload-r2", {
            method: "POST",
            body: formData,
          })
          const data = await res.json()
          
          if (!res.ok) throw new Error(data.error || "Upload failed")
          
          if (data.url) {
            uploadedUrls.push(data.url)
          }
        } catch (err: any) {
        console.error("Upload error:", err)
      }
    }

    if (uploadedUrls.length > 0) {
      setNewTile(prev => ({
        ...prev,
        faces: [...prev.faces, ...uploadedUrls]
      }))
    }
    setIsUploading(false)
    e.target.value = '' // Reset input so the same file can be selected again
  }

  // Handle uploading custom QR Code Image file
  const handleQRFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|heic)$/i.test(file.name)
    if (!isImage) {
      alert(`File ${file.name} is not recognized as a valid image.`)
      return
    }

    setIsUploadingQR(true)
      try {
        const formData = new FormData()
        formData.append("file", file)
  
        const res = await fetch("/api/upload-r2", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        
        if (!res.ok) throw new Error(data.error || "Upload failed")
        
        if (data.url) {
          setNewTile(prev => ({ ...prev, qrImage: data.url }))
        }
      } catch (err) {
      console.error("QR Upload Error:", err)
    } finally {
      setIsUploadingQR(false)
      e.target.value = '' // Reset input so the same file can be selected again
    }
  }

  // Save New or Edit Tile to Catalogue State
  const handleSaveNewTile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTile.name.trim()) return

    if (editingTileId) {
      const sizeStr = newTile.thickness.trim() ? `${newTile.size} | ${newTile.thickness.trim()}` : newTile.size;
      // Update existing tile in DB
      const updatedData = {
        name: newTile.name.toUpperCase(),
        category: newTile.category,
        size: sizeStr,
        finish: newTile.category === "one-piece" ? JSON.stringify(newTile.featureIcons) : newTile.finish.toUpperCase(),
        facesCount: parseInt(newTile.facesCount) || (newTile.faces.length || 4),
        faces: newTile.faces.length > 0 ? newTile.faces : undefined,
        qrImage: newTile.qrImage,
        qrUrl: newTile.qrUrl
      }
      const updatedTile = await updateCatalogueDesign(editingTileId, updatedData)
      
      setItems(prev => prev.map(item => {
        if (item.id === editingTileId) {
          return {
            ...item,
            ...updatedData,
            faces: updatedData.faces || item.faces
          }
        }
        return item
      }))
    } else {
      const sizeStr = newTile.thickness.trim() ? `${newTile.size} | ${newTile.thickness.trim()}` : newTile.size;
      // Add new tile to DB
      const newTileData = {
        category: newTile.category,
        name: newTile.name.toUpperCase(),
        code: newTile.code || `ST-${items.length + 101}`,
        size: sizeStr,
        finish: newTile.category === "one-piece" ? JSON.stringify(newTile.featureIcons) : newTile.finish.toUpperCase(),
        facesCount: parseInt(newTile.facesCount) || (newTile.faces.length || 4),
        faces: newTile.faces.length > 0 ? newTile.faces : [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
        ],
        qrImage: newTile.qrImage,
        qrUrl: newTile.qrUrl,
        sortOrder: items.length
      }
      
      const createdTile = await addCatalogueDesign(newTileData)
      setItems(prev => [...prev, { ...createdTile, faces: newTileData.faces }])
    }

    setIsAddModalOpen(false)
    setEditingTileId(null)
    setIsCustomFinish(false)
    setNewTile({ name: "", category: selectedCategory === "all" ? "flooring" : selectedCategory, code: "", size: "600x1200 mm", thickness: "", finish: "HIGH GLOSSY", facesCount: "4", faces: [], qrImage: "", qrUrl: "", featureIcons: [] })
  }

  // Remove tile item from catalogue
  const handleRemoveTile = async (id: string) => {

    await deleteCatalogueDesign(id)
    setItems(prev => prev.filter(item => item.id !== id))
  }

  // Scroll to page helper — uses scrollIntoView which works inside any scroll container
  const scrollToPage = (pageId: string) => {
    const el = document.getElementById(pageId)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // Export Multi-Page High-Definition PDF File directly (100% Un-distorted 1:1)
  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      let html2canvas: any
      try {
        html2canvas = (await import("html2canvas-pro")).default
      } catch (e) {
        html2canvas = (await import("html2canvas")).default
      }

      let doc: jsPDF | null = null
      const totalPages = numIndexPages + 2 + (filteredItems.length * 2)

      for (let i = 1; i <= totalPages; i++) {
        const pageEl = document.getElementById(`page-${i}`)
        if (!pageEl) continue

        // Hide only administrative edit/delete icons during capture
        const adminBtns = pageEl.querySelectorAll(".no-export-btn")
        adminBtns.forEach((btn: any) => { btn.style.visibility = "hidden" })

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#0A192F",
          logging: false,
          onclone: (clonedDoc: Document) => {
            // Replace any modern CSS lab() / oklch() color spaces with hex/rgb
            const allNodes = clonedDoc.querySelectorAll("*")
            allNodes.forEach((node: any) => {
              try {
                const comp = window.getComputedStyle(node)
                if (comp.color && (comp.color.includes("lab") || comp.color.includes("oklch"))) {
                  node.style.color = "#ffffff"
                }
                if (comp.backgroundColor && (comp.backgroundColor.includes("lab") || comp.backgroundColor.includes("oklch"))) {
                  node.style.backgroundColor = "#0A192F"
                }
                if (comp.borderColor && (comp.borderColor.includes("lab") || comp.borderColor.includes("oklch"))) {
                  node.style.borderColor = "rgba(212, 175, 55, 0.4)"
                }
              } catch (err) {}
            })
          }
        })

        // Restore admin buttons
        adminBtns.forEach((btn: any) => { btn.style.visibility = "" })

        const canvasW = canvas.width
        const canvasH = canvas.height
        const orientation = canvasW >= canvasH ? "landscape" : "portrait"

        if (!doc) {
          doc = new jsPDF({
            orientation: orientation,
            unit: "px",
            format: [canvasW, canvasH],
            compress: true
          })
        } else {
          doc.addPage([canvasW, canvasH], orientation)
        }

        const imgData = canvas.toDataURL("image/png")
        doc.addImage(imgData, "PNG", 0, 0, canvasW, canvasH)

        // ========================================================
        // ADD INTERACTIVE PDF LINKS (Internal Page Jumps & Web QR)
        // ========================================================
        const pageRect = pageEl.getBoundingClientRect()

        // 1. Interactive Index Swatches -> Product Detail Pages
        const swatchEls = pageEl.querySelectorAll("[data-target-page]")
        swatchEls.forEach((swatchEl: any) => {
          const targetPg = parseInt(swatchEl.getAttribute("data-target-page") || "2")
          const r = swatchEl.getBoundingClientRect()
          const x = ((r.left - pageRect.left) / pageRect.width) * canvasW
          const y = ((r.top - pageRect.top) / pageRect.height) * canvasH
          const w = (r.width / pageRect.width) * canvasW
          const h = (r.height / pageRect.height) * canvasH
          doc?.link(x, y, w, h, { pageNumber: targetPg })
        })

        // 2. Interactive "BACK TO INDEX" Buttons -> Page 2
        const backEls = pageEl.querySelectorAll("[data-page-link]")
        backEls.forEach((backEl: any) => {
          const targetPg = parseInt(backEl.getAttribute("data-page-link") || "2")
          const r = backEl.getBoundingClientRect()
          const x = ((r.left - pageRect.left) / pageRect.width) * canvasW
          const y = ((r.top - pageRect.top) / pageRect.height) * canvasH
          const w = (r.width / pageRect.width) * canvasW
          const h = (r.height / pageRect.height) * canvasH
          doc?.link(x, y, w, h, { pageNumber: targetPg })
        })

        // 3. Interactive Clickable QR Codes -> 3D Web View URL
        const qrEls = pageEl.querySelectorAll("[data-qr-url]")
        qrEls.forEach((qrEl: any) => {
          const url = qrEl.getAttribute("data-qr-url")
          if (!url) return
          const r = qrEl.getBoundingClientRect()
          const x = ((r.left - pageRect.left) / pageRect.width) * canvasW
          const y = ((r.top - pageRect.top) / pageRect.height) * canvasH
          const w = (r.width / pageRect.width) * canvasW
          const h = (r.height / pageRect.height) * canvasH
          doc?.link(x, y, w, h, { url })
        })
      }

      if (doc) {
        doc.save(`Patel_Tiles_Catalogue_${selectedCategory.toUpperCase()}_2026.pdf`)
      }
    } catch (err) {
      console.error("PDF generation error, falling back to browser print:", err)
      window.print()
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <div className="w-full min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Studio Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-6 border-b border-slate-200/80 mb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#0F4C3A]" /> Catalogue Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
              Multi-Catalogue Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create custom catalogues for Flooring, Bathroom, Parking, Pooja Room & Elevation tiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Add New Tile Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[#0F4C3A] hover:bg-[#0c3d2e] text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Designs</span>
          </button>

          {/* Theme Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTheme("dark")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTheme === "dark" ? "bg-[#0A192F] text-[#D4AF37] shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🌌 Midnight Gold
            </button>
            <button
              onClick={() => setActiveTheme("light")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTheme === "light" ? "bg-white text-[#0A192F] shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ✨ Crisp Studio
            </button>
          </div>

          {/* Download PDF */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49f27] text-[#0A192F] px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isExportingPDF ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating HD PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CATALOGUE CATEGORY SELECTOR BAR */}
      <div className="mb-8 p-3 rounded-2xl bg-[#0A192F] border border-[#D4AF37]/30 shadow-lg print:hidden">
        <div className="flex items-center justify-between gap-2 mb-2 px-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Select Catalogue Category to Generate:
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-bold">
            Showing {filteredItems.length} Tiles • {numIndexPages} Index {numIndexPages === 1 ? "Page" : "Pages"}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATALOGUE_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? "bg-[#D4AF37] text-[#0A192F] border-[#D4AF37] shadow-md font-black"
                    : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-[#D4AF37]/50 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="space-y-12">
        {/* ============================================================ */}
        {/* PAGE 1: LUXURY STRIKING COVER PAGE                           */}
        {/* ============================================================ */}
        <section
          id="page-1"
          className={`w-full h-[760px] rounded-3xl p-8 sm:p-16 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-colors ${
            activeTheme === "dark"
              ? "bg-[#0A192F] text-white border-2 border-[#D4AF37]/30"
              : "bg-slate-50 text-slate-900 border-2 border-[#D4AF37]/40"
          }`}
        >
          {/* Metallic Gold Border Inner Frame */}
          <div className="absolute inset-4 rounded-2xl border border-[#D4AF37]/40 pointer-events-none" />

          {/* Top Brand Tag */}
          <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-xs font-black tracking-widest text-[#D4AF37] uppercase">
                PREMIUM ARCHITECTURAL COLLECTION
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-[#D4AF37]/80">2026 EDITION</span>
            </div>
          </div>

          {/* Center Title Layout with Asymmetrical Frame */}
          <div className="my-auto text-center z-10 max-w-3xl mx-auto space-y-6">
            {/* Showroom Official White Logo Emblem - Large & Fills Golden Box */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl bg-gradient-to-tr from-[#D4AF37] via-[#0F4C3A] to-[#D4AF37] p-1 shadow-2xl flex items-center justify-center border-2 border-[#D4AF37]">
              <div className="w-full h-full rounded-[24px] bg-[#0A192F] flex items-center justify-center p-1 overflow-hidden">
                <img 
                  src="/logo-emblem.png" 
                  alt="Patel Tiles Logo" 
                  className="w-full h-full object-contain scale-110" 
                  style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 12px rgba(212, 175, 55, 0.5))" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase leading-none text-white">
                {catalogTitle}
              </h1>
              <p className="text-xs sm:text-sm font-bold tracking-widest text-[#D4AF37] uppercase pt-2">
                One Stop Solution For House Construction
              </p>
            </div>

            {/* Gold Metallic Line */}
            <div className="h-0.5 w-44 mx-auto bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

            <div className="space-y-3 pt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase text-slate-100">
                {catalogSubtitle}
              </h2>
              <div className="inline-flex px-5 py-2 rounded-xl bg-[#0F4C3A]/80 border border-[#D4AF37]/40 text-xs font-mono text-[#D4AF37] font-bold shadow-lg">
                {tileSizeText}
              </div>
            </div>
          </div>

          {/* Cover Footer */}
          <div className="flex justify-between items-end text-xs font-medium text-slate-300 z-10 pt-6 border-t border-[#D4AF37]/20">
            <div>
              {selectedCategory !== 'all' && (
                <p className="tracking-wide">Glossy, High Glossy, Matt, Carving, Inky</p>
              )}
            </div>
            <p className="font-mono text-[#D4AF37]">Page 1</p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* VISUAL INDEX PAGES (PAGE 2, PAGE 3, ETC.)                    */}
        {/* ============================================================ */}
        {indexPagesChunks.map((chunkItems, pageIdx) => {
          const indexPageNum = pageIdx + 2

          return (
            <section
              key={`index-page-${pageIdx}`}
              id={`page-${indexPageNum}`}
              className={`w-full h-[760px] rounded-3xl p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-colors ${
                activeTheme === "dark"
                  ? "bg-[#091527] text-white border border-[#D4AF37]/20"
                  : "bg-white text-slate-900 border border-slate-200"
              }`}
            >
              <div>
                {/* Header Banner */}
                <div className="flex justify-between items-end border-b-2 border-[#D4AF37]/40 pb-3 mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                      Interactive Table of Contents {numIndexPages > 1 ? `(Part ${pageIdx + 1} of ${numIndexPages})` : ""}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">Visual Index</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Click or tap any compact tile swatch to jump directly to its full design page.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl border border-[#D4AF37]/30">
                    <span>{filteredItems.length} Total Designs</span>
                  </div>
                </div>

                {/* Compact Category / Finish-wise Sectioned Grid */}
                {(() => {
                  const getFinish = (t: any) => t.category === 'one-piece' ? 'ONE PIECE' : (t.finish || 'GLOSSY').toUpperCase()
                  const finishTypes = Array.from(new Set(chunkItems.map(getFinish)))

                  return (
                    <div className="space-y-4">
                      {finishTypes.map((finishName: any) => {
                        const groupItems = chunkItems.filter((t: any) => getFinish(t) === finishName)
                        return (
                          <div key={finishName} className="space-y-2.5">
                            {/* Finish Section Header */}
                            <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37]">
                                  {finishName} SERIES
                                </h3>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-slate-400">
                                {groupItems.length} {groupItems.length === 1 ? "Design" : "Designs"}
                              </span>
                            </div>

                            {/* Balanced Medium-Compact Swatches Grid (6-7 columns) */}
                            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-7 gap-3">
                              {groupItems.map((tile: any) => {
                                const targetPageId = `page-${tile.pageNum}`
                                return (
                                  <div
                                    key={tile.id}
                                    data-target-page={tile.pageNum}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, tile.id)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, tile.id)}
                                    onClick={() => scrollToPage(targetPageId)}
                                    className={`group cursor-grab active:cursor-grabbing rounded-xl overflow-hidden border bg-[#0A192F]/80 hover:border-[#D4AF37] hover:shadow-xl transition-all flex flex-col items-center p-1.5 relative ${
                                      draggedTileId === tile.id ? "opacity-40 border-dashed border-[#D4AF37]" : "border-slate-800"
                                    }`}
                                  >
                                    {/* Up / Down Move Order Controls */}
                                    <div className="absolute top-1 left-1 z-10 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity no-export-btn">
                                      <button
                                        onClick={(e) => handleMoveTileUp(e, tile.id)}
                                        className="p-1 rounded bg-[#0A192F]/90 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A192F] border border-[#D4AF37]/40 shadow-sm"
                                        title="Move tile up in catalogue order"
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => handleMoveTileDown(e, tile.id)}
                                        className="p-1 rounded bg-[#0A192F]/90 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A192F] border border-[#D4AF37]/40 shadow-sm"
                                        title="Move tile down in catalogue order"
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Medium-Compact Swatch Thumbnail */}
                                    {(() => {
                                      const s = (tile.size || "").toLowerCase().replace(/\s/g, '')
                                      const isSquareTile = (s.includes('600x600') || s.includes('2x2'))
                                      
                                      const aspectClass = tile.category === 'one-piece' || isSquareTile ? 'aspect-square' : 'aspect-[1/2]'
                                      const bgClass = tile.category === 'one-piece' ? 'bg-slate-100 p-2' : 'bg-slate-900'
                                      const imgClass = `w-full h-full group-hover:scale-105 transition-transform duration-300 ${tile.category === 'one-piece' ? 'object-contain mix-blend-multiply' : 'object-cover'}`

                                      return (
                                        <div className={`relative w-16 sm:w-20 ${aspectClass} ${bgClass} rounded-lg overflow-hidden border border-slate-700/50 flex items-center justify-center`}>
                                          <img
                                            src={tile.normalFaces?.[0] || tile.faces[0]}
                                            alt={tile.name}
                                            className={imgClass}
                                          />
                                        </div>
                                      )
                                    })()}

                                    {/* Swatch Label */}
                                    <div className="mt-1.5 text-center w-full">
                                      <h3 className="text-[10px] font-bold text-white group-hover:text-[#D4AF37] transition-colors truncate leading-tight">
                                        {tile.name}
                                      </h3>
                                      {tile.category !== 'one-piece' && (
                                        <p className="text-[8px] text-[#D4AF37]/80 font-bold uppercase tracking-wider mt-0.5">
                                          {tile.finish}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Index Footer */}
              <div className="flex justify-between items-center text-xs font-medium text-slate-400 pt-6 mt-6 border-t border-white/10">
                <p>Patel Tiles & Ceramic • {catalogSubtitle}</p>
                <p className="font-mono text-[#D4AF37]">Page {indexPageNum}</p>
              </div>
            </section>
          )
        })}

        {/* ============================================================ */}
        {/* PRODUCT DETAIL PAGES (RECTANGULAR CERAMIC SLABS)             */}
        {/* ============================================================ */}
        {itemsWithPageNum.map((tile) => {
          const pageId = `page-${tile.pageNum}`

          return (
            <div key={tile.id} id={pageId} className="relative">
              {/* FLOATING LEFT: Edit & Remove buttons outside the page card (hidden in PDF) */}
              <div className="absolute -left-2 top-8 flex flex-col gap-2 z-10 no-export-btn">
                <button
                  onClick={() => handleEditTile(tile)}
                  className="flex flex-col items-center gap-1.5 px-2.5 py-3 rounded-xl bg-slate-800 hover:bg-[#D4AF37] hover:text-[#0A192F] text-slate-100 transition-all border border-slate-700 shadow-lg cursor-pointer active:scale-95"
                  title="Edit tile design details"
                >
                  <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>EDIT</span>
                </button>
                <button
                  onClick={() => handleRemoveTile(tile.id)}
                  className="flex flex-col items-center gap-1.5 px-2.5 py-3 rounded-xl bg-red-950/90 hover:bg-red-600 text-red-300 hover:text-white transition-all border border-red-800/60 shadow-lg cursor-pointer active:scale-95"
                  title="Remove tile from catalogue"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>DEL</span>
                </button>
              </div>

            {tile.category === 'one-piece' ? (
              <section
                className={`w-full h-[760px] rounded-3xl p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-colors ${
                  activeTheme === "dark"
                    ? "bg-[#0A192F] text-white border border-[#D4AF37]/20"
                    : "bg-white text-slate-900 border border-slate-200"
                }`}
              >
                {/* ONE PIECE LAYOUT (Main Content Area) */}
                <div className="flex-1 flex items-center mb-6">
                  {/* Left: Details */}
                  <div className="w-[55%] pr-12 py-4">
                    <h2 className="text-5xl font-black uppercase tracking-wider text-white mb-3">
                      {tile.name}
                    </h2>
                    <p className="text-base font-black uppercase tracking-widest text-[#D4AF37] mb-10 border-b border-[#D4AF37]/30 pb-4 inline-block pr-12">
                      DIMENSION: {tile.size}
                    </p>

                    {/* Features List */}
                    <div className="space-y-5 mt-4">
                      {(() => {
                        let features: string[] = []
                        try {
                          features = JSON.parse(tile.finish || "[]")
                          if (!Array.isArray(features)) features = []
                        } catch(e) {}
                        return features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-5 h-5 rounded-full bg-[#0F4C3A] border-2 border-[#D4AF37]/80 flex items-center justify-center shrink-0 shadow-md">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                            </div>
                            <span className="text-lg font-bold text-slate-200 uppercase tracking-wider">{feature}</span>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>

                  {/* Vertical Divider (Shortened) */}
                  <div className="w-px h-[60%] bg-[#D4AF37]/30" />

                  {/* Right: Image */}
                  <div className="w-[45%] flex flex-col justify-center items-center pl-10">
                    <div className="w-full aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-2xl p-6 flex items-center justify-center border-4 border-[#D4AF37]/10">
                      <img 
                        src={tile.normalFaces?.[0] || ""} 
                        alt={tile.name} 
                        className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl" 
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="flex justify-between items-center pt-6 border-t border-white/10 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#0A192F] font-mono font-black flex items-center justify-center text-sm shadow-md">
                      {tile.pageNum}
                    </div>
                    <span className="text-xs font-mono text-slate-400">Patel Tiles & Ceramic</span>
                  </div>
                  <button
                    data-page-link="2"
                    onClick={() => scrollToPage("page-2")}
                    className="flex items-center gap-2 bg-[#0F4C3A] hover:bg-[#D4AF37] hover:text-[#0A192F] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer border border-[#D4AF37]/40"
                  >
                    <span>👈 BACK TO INDEX</span>
                  </button>
                </div>
              </section>
            ) : (
              <section
                className={`w-full h-[760px] rounded-3xl p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-colors ${
                  activeTheme === "dark"
                    ? "bg-[#0A192F] text-white border border-[#D4AF37]/20"
                    : "bg-white text-slate-900 border border-slate-200"
                }`}
              >

              {/* ── HEADER: Tile Name | SURFACE badge | RANDOM badge | QR Code ── */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#D4AF37]/30 mb-2">

                {/* Tile Name + Size */}
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37]">
                    {tile.size}
                  </span>
                  <h2 className="text-3xl font-black uppercase tracking-wider text-white truncate">
                    {tile.name}
                  </h2>
                </div>

                {/* SURFACE Badge */}
                <span className="px-4 py-2 rounded-xl bg-[#0F4C3A] text-emerald-100 border border-[#D4AF37]/30 text-xs font-bold uppercase tracking-wider shadow-md shrink-0">
                  SURFACE: {tile.finish}
                </span>

                {/* RANDOM Badge */}
                <span className="px-4 py-2 rounded-xl bg-[#0F4C3A] text-emerald-100 border border-[#D4AF37]/30 text-xs font-bold uppercase tracking-wider shadow-md shrink-0">
                  RANDOM: {tile.facesCount} FACE
                </span>

                {/* QR Code (enlarged) — only renders if user uploaded a QR or provided a URL */}
                {(tile.qrUrl || tile.qrImage) && (
                  <a
                    href={tile.qrUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    data-qr-url={tile.qrUrl || ""}
                    className="flex flex-col items-center group cursor-pointer shrink-0 ml-auto"
                  >
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-white p-2 shadow-xl group-hover:scale-105 transition-transform">
                      <img
                        src={tile.qrImage || `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(tile.qrUrl!)}`}
                        alt="Tile QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[#D4AF37] mt-1.5 tracking-wider uppercase group-hover:underline">
                      SCAN 3D VIEW
                    </span>
                  </a>
                )}
              </div>

              {/* Main Tile Faces Rendering Area (smaller, tighter grid) */}
              <div className="my-1">
                {(() => {
                  const s = (tile.size || "").toLowerCase().replace(/\s/g, '')
                  const isSquareTile = (s.includes('600x600') || s.includes('2x2')) && tile.normalFaces?.length === 1
                  
                  if (isSquareTile) {
                    return (
                      <div className="flex justify-center my-2">
                        <div className="grid grid-cols-2 gap-[8px] bg-slate-900 dark:bg-slate-800 p-[8px] shadow-2xl border border-slate-600/50 rounded-xl">
                          {[1, 2].map(idx => (
                            <div key={idx} className="w-44 h-44 md:w-80 md:h-80 lg:w-[400px] lg:h-[400px] bg-black overflow-hidden relative border border-slate-700/50">
                              <img src={tile.normalFaces[0]} alt="" className="w-full h-full object-cover shadow-inner" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div className="flex flex-wrap justify-center items-center gap-4 max-w-4xl mx-auto">
                      {tile.normalFaces.map((faceUrl: any, fIdx: any) => (
                        <div
                          key={fIdx}
                          className="aspect-[1/2] w-36 sm:w-44 rounded-none overflow-hidden border-2 border-slate-700/90 hover:border-[#D4AF37] shadow-xl bg-slate-900 relative group shrink-0"
                        >
                          <img
                            src={faceUrl}
                            alt={`${tile.name} Face ${fIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Bottom Interactive Navigation */}
              <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-2">
                {/* Left: Page Pill */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#0A192F] font-mono font-black flex items-center justify-center text-sm shadow-md">
                    {tile.pageNum}
                  </div>
                  <span className="text-xs font-mono text-slate-400">Patel Tiles & Ceramic</span>
                </div>

                {/* Right: Back to Index Button */}
                <button
                  data-page-link="2"
                  onClick={() => scrollToPage("page-2")}
                  className="flex items-center gap-2 bg-[#0F4C3A] hover:bg-[#D4AF37] hover:text-[#0A192F] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer border border-[#D4AF37]/40"
                >
                  <span>👈 BACK TO INDEX</span>
                </button>
              </div>
            </section>
            )}
            
            {/* ── SCENE IMAGE FULL PAGE (Optional) ── */}
            {tile.hasScene && (
              <section
                id={`page-${tile.scenePageNum}`}
                className={`w-full h-[760px] rounded-3xl relative overflow-hidden shadow-2xl transition-colors mt-8 print:mt-0 print:break-before-page ${
                  activeTheme === "dark"
                    ? "bg-[#0A192F] border border-[#D4AF37]/20"
                    : "bg-white border border-slate-200"
                }`}
              >
                <img
                  src={tile.sceneFaces[0]}
                  alt={`${tile.name} Scene`}
                  className="w-full h-full object-cover"
                />
                
                {/* Scene Bottom Navigation Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#0A192F] font-mono font-black flex items-center justify-center text-sm shadow-md">
                      {tile.scenePageNum}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold tracking-wider uppercase">{tile.name}</span>
                      <span className="text-xs font-mono text-slate-300">Patel Tiles & Ceramic</span>
                    </div>
                  </div>
                  
                  {/* Right: Back to Index Button */}
                  <button
                    data-page-link="2"
                    onClick={() => scrollToPage("page-2")}
                    className="flex items-center gap-2 bg-[#0F4C3A] hover:bg-[#D4AF37] hover:text-[#0A192F] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer border border-[#D4AF37]/40"
                  >
                    <span>👈 BACK TO INDEX</span>
                  </button>
                </div>
              </section>
            )}

            </div>
          )
        })}

        {/* ============================================================ */}
        {/* FINAL PAGE: LUXURY SHOWROOM DIRECTORY BACK COVER            */}
        {/* ============================================================ */}
        <section
          id={`page-${numIndexPages + 2 + filteredItems.length}`}
          className={`w-full h-[760px] rounded-3xl p-8 sm:p-16 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-colors ${
            activeTheme === "dark"
              ? "bg-[#0A192F] text-white border-2 border-[#D4AF37]/30"
              : "bg-white text-slate-900 border-2 border-slate-200"
          }`}
        >
          {/* Top Brand Header */}
          <div className="flex justify-between items-center z-10 border-b border-[#D4AF37]/30 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0A192F] p-1.5 border-2 border-[#D4AF37] shadow-lg flex items-center justify-center shrink-0">
                <img 
                  src="/logo-emblem.png" 
                  alt="Patel Tiles Emblem" 
                  className="w-full h-full object-contain" 
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
              <h2 className="text-xl font-black uppercase tracking-wider text-white">PATEL TILES & CERAMIC</h2>
            </div>
            <span className="text-xs font-mono text-[#D4AF37]">SHOWROOM DIRECTORY</span>
          </div>

          {/* Center Thank You Banner & Contact Details Card */}
          <div className="my-auto text-center z-10 max-w-3xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white mb-2">
                THANK YOU
              </h1>
              <p className="text-base sm:text-lg font-bold text-[#D4AF37] tracking-widest uppercase">
                Visit Us Again For Premium Architectural Surfaces
              </p>
            </div>

            {/* Asymmetrical Callout Contact Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left p-8 rounded-3xl bg-[#091527] border-2 border-[#D4AF37]/40 shadow-2xl">
              <div className="flex items-start gap-3.5 sm:col-span-2">
                <div className="w-9 h-9 rounded-xl bg-[#0F4C3A] text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Showroom Address</h4>
                  <p className="text-xs font-semibold text-slate-200 mt-1 leading-relaxed">
                    Survey no 782, Near JCB Showroom, National Highway 65,<br />Kandi 502285, Sangareddy Dist, Telangana
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F4C3A] text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Customer Care</h4>
                  <p className="text-xs font-semibold text-slate-200 mt-1">
                    8885002211 / 9640044211
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs font-medium text-slate-400 z-10 pt-6 border-t border-white/10">
            <p>© 2026 Patel Tiles & Ceramic. All rights reserved.</p>
            <button
              onClick={() => scrollToPage("page-2")}
              className="text-[#D4AF37] font-bold hover:underline"
            >
              👈 Return to Visual Index
            </button>
          </div>
        </section>
      </div>

      {/* ============================================================ */}
      {/* UPLOAD / ADD TILE MODAL                                       */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A192F] text-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border-2 border-[#D4AF37]/40 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F4C3A] text-[#D4AF37] flex items-center justify-center font-bold border border-[#D4AF37]/40">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingTileId ? "Edit Design" : "Upload New Designs"}
                    </h3>
                    <p className="text-xs text-slate-400">Add or edit face photos, size, finish, category and custom QR code.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNewTile} className="mt-6 space-y-6">
                
                {/* SECTION 1: Basic Details */}
                <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    Basic Details
                  </h3>
                  
                  {/* Catalogue Category Tag Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Catalogue Category
                    </label>
                    <select
                      value={newTile.category}
                      onChange={(e) => setNewTile({ ...newTile, category: e.target.value })}
                      className="w-full px-4 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 focus:border-[#D4AF37] outline-none text-white font-bold transition-colors"
                    >
                      <option value="flooring">Flooring Tiles</option>
                      <option value="bathroom">Bathroom Tiles</option>
                      <option value="parking">Parking Tiles</option>
                      <option value="pooja">Pooja Room Tiles</option>
                      <option value="elevation">Elevation Tiles</option>
                      <option value="one-piece">One Piece</option>
                    </select>
                  </div>

                  {/* Tile Name with Autocomplete Inventory Suggestions */}
                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Tile Design Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Type name (e.g. ASTEROID WHITE, ARMANI GREY)..."
                      value={newTile.name}
                      onChange={(e) => {
                        setNewTile({ ...newTile, name: e.target.value })
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full px-4 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 focus:border-[#D4AF37] outline-none text-white font-bold transition-colors"
                    />

                    {/* Auto-suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-[#D4AF37]/40 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        <div className="p-1">
                          <p className="text-[9px] font-black uppercase text-[#D4AF37] px-3 py-1 border-b border-slate-800">
                            Matching Inventory Items
                          </p>
                          {suggestions.map((inv) => (
                            <div
                              key={inv.id}
                              onClick={() => handleSelectSuggestion(inv)}
                              className="px-3 py-2 hover:bg-[#0F4C3A] cursor-pointer text-xs flex items-center justify-between transition-colors rounded-lg"
                            >
                              <span className="font-bold text-white">{inv.name}</span>
                              <span className="text-[10px] text-[#D4AF37] font-semibold">
                                {inv.size || "600x1200mm"} • {inv.type || "Glossy"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: Specifications */}
                <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    Specifications
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {newTile.category !== 'one-piece' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                          Surface Finish
                        </label>
                        {isCustomFinish ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newTile.finish}
                              onChange={(e) => setNewTile({ ...newTile, finish: e.target.value })}
                              placeholder="Type finish..."
                              className="w-full px-4 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 focus:border-[#D4AF37] outline-none text-white font-semibold transition-colors"
                            />
                            <button type="button" onClick={() => { setIsCustomFinish(false); setNewTile({ ...newTile, finish: "HIGH GLOSSY" }) }} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <select
                            value={newTile.finish}
                            onChange={(e) => {
                              if (e.target.value === "ADD_CUSTOM") {
                                setIsCustomFinish(true)
                                setNewTile({ ...newTile, finish: "" })
                              } else {
                                setNewTile({ ...newTile, finish: e.target.value })
                              }
                            }}
                            className="w-full px-4 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 focus:border-[#D4AF37] outline-none text-white font-semibold transition-colors"
                          >
                            <option value="HIGH GLOSSY">HIGH GLOSSY</option>
                            <option value="GLOSSY">GLOSSY</option>
                            <option value="MATT">MATT</option>
                            <option value="CARVING">CARVING</option>
                            <option value="INKY">INKY</option>
                            <option value="SPECIAL COLORS">SPECIAL COLORS</option>
                            {Array.from(new Set(
                              items
                                .filter(item => item.category !== 'one-piece' && item.finish)
                                .map(item => item.finish.toUpperCase())
                            )).filter(f => !["HIGH GLOSSY", "GLOSSY", "MATT", "CARVING", "INKY", "SPECIAL COLORS"].includes(f)).map(cf => (
                              <option key={cf} value={cf}>{cf}</option>
                            ))}
                            <option value="ADD_CUSTOM">+ Add Custom Finish</option>
                          </select>
                        )}
                      </div>
                    )}

                    <div className={newTile.category === 'one-piece' ? "col-span-2" : ""}>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                          Tile Dimensions
                        </label>
                        <input
                          type="text"
                          value={newTile.size}
                          onChange={(e) => setNewTile({ ...newTile, size: e.target.value })}
                          className="w-full px-4 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 focus:border-[#D4AF37] outline-none text-white font-semibold transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Random Faces Count (Not for One Piece) */}
                    {newTile.category !== 'one-piece' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                          Random Faces
                        </label>
                        <select
                          value={newTile.facesCount}
                          onChange={(e) => setNewTile({ ...newTile, facesCount: e.target.value })}
                          className="w-full px-4 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 focus:border-[#D4AF37] outline-none text-white font-semibold transition-colors"
                        >
                          <option value="1">1 Face (Single)</option>
                          <option value="2">2 Faces (Double)</option>
                          <option value="4">4 Faces (Quad Random)</option>
                          <option value="6">6 Faces (Hex Random)</option>
                        </select>
                      </div>
                    )}

                    {/* Thickness moved here */}
                    <div className={newTile.category === 'one-piece' ? "col-span-2" : ""}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Thickness <span className="text-[10px] text-slate-500 font-normal">(Opt.)</span>
                      </label>
                      <input
                        type="text"
                        value={newTile.thickness}
                        placeholder="e.g. 9 mm"
                        onChange={(e) => setNewTile({ ...newTile, thickness: e.target.value })}
                        className="w-full px-4 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 focus:border-[#D4AF37] outline-none text-white font-semibold transition-colors"
                      />
                    </div>
                  </div>

                  {/* Feature Icons (Only for One Piece) */}
                  {newTile.category === 'one-piece' && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Feature Icons (Select applicable)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {["SYPHONIC FLUSHING", "WASHDOWN FLUSHING", "6D FLUSHING", "5D FLUSHING", "4D FLUSHING", "RIMLESS", "2D FLUSHING"].map(icon => {
                          const isSelected = newTile.featureIcons.includes(icon)
                          return (
                            <label key={icon} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${isSelected ? "bg-[#D4AF37]/10 border-[#D4AF37]" : "bg-slate-900 border-slate-700 hover:border-slate-500"}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  setNewTile(prev => ({
                                    ...prev,
                                    featureIcons: e.target.checked 
                                      ? [...prev.featureIcons, icon] 
                                      : prev.featureIcons.filter(i => i !== icon)
                                  }))
                                }}
                                className="accent-[#D4AF37]"
                              />
                              <span className="text-[10px] font-bold text-slate-300">{icon}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 3: Media & Assets */}
                <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                    Media & Assets
                  </h3>

                  {/* Photos Upload Area */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      {newTile.category === 'one-piece' ? "Upload Product Photo (JPG, PNG, WebP)" : "Upload Tile Face Photos (JPG, PNG, WebP)"}
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20 border-2 border-dashed border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-xl bg-slate-900 flex flex-col items-center justify-center cursor-pointer transition-all p-3"
                    >
                      {isUploading ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Uploading photos...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#D4AF37] mb-1" />
                          <span className="text-xs font-bold text-slate-300">Click or drop {newTile.category === 'one-piece' ? "product photo" : "face photos"}</span>
                          <span className="text-[10px] text-slate-500">
                            {newTile.category === 'one-piece' ? "Upload 1 main product image" : "Upload 1 to 6 face images"}
                          </span>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleFilesUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Uploaded Faces Preview */}
                  {newTile.faces.length > 0 && (
                    <div className="bg-slate-900/50 p-2 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Uploaded Faces ({newTile.faces.length}):
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {newTile.faces.map((url, idx) => (
                          <div key={idx} className="relative w-12 h-18 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewTile(prev => ({ ...prev, faces: prev.faces.filter((_, i) => i !== idx) }))}
                              className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* QR Section (Not for One Piece) */}
                  {newTile.category !== 'one-piece' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* QR Web Link URL Input */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                          3D View / Web Link
                        </label>
                        <input
                          type="text"
                          placeholder="https://pateltilesceramic.com/tile/ST-101..."
                          value={newTile.qrUrl}
                          onChange={(e) => setNewTile({ ...newTile, qrUrl: e.target.value })}
                          className="w-full px-4 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 focus:border-[#D4AF37] outline-none text-white font-semibold transition-colors"
                        />
                        <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                          QR scan redirects to this web link.
                        </p>
                      </div>

                      {/* Upload Custom QR Code Image */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                          Custom QR Image
                        </label>
                        {newTile.qrImage ? (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-[#D4AF37]/40 h-[38px]">
                            <img src={newTile.qrImage} alt="QR Code Preview" className="w-6 h-6 object-contain bg-white rounded flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-white truncate">Image Attached</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewTile(prev => ({ ...prev, qrImage: "" }))}
                              className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => qrFileInputRef.current?.click()}
                            className="w-full h-[38px] border border-dashed border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-xl bg-slate-900 flex items-center justify-center gap-2 cursor-pointer transition-all px-2"
                          >
                            {isUploadingQR ? (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-[#D4AF37]">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Uploading...</span>
                              </div>
                            ) : (
                              <>
                                <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span className="text-[10px] font-bold text-slate-300">Upload QR Image</span>
                              </>
                            )}
                          </div>
                        )}
                        <input
                          ref={qrFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleQRFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold">* Required</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A192F] font-black text-xs hover:bg-white hover:text-[#0A192F] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingTileId ? "SAVE CHANGES" : "ADD DESIGN"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Styles for PDF Export */}
      <style>{`
        @page {
          size: landscape;
          margin: 0;
        }
        @media print {
          html, body {
            background: #0A192F !important;
            color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside, header, nav, .print\:hidden {
            display: none !important;
          }
          section {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            width: 100% !important;
            min-height: 100vh !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
