"use server"
import { revalidatePath } from "next/cache"
import prisma from "./prisma"

export async function getInventory() {
  const items = await prisma.inventory.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: 'desc' }
  })

  // Get distinct categories and types for the dropdowns
  const distinctCategories = await prisma.inventory.findMany({
    where: { isArchived: false },
    select: { category: true },
    distinct: ['category']
  })

  const distinctTypes = await prisma.inventory.findMany({
    where: { isArchived: false },
    select: { type: true },
    distinct: ['type']
  })

  const distinctSizes = await prisma.inventory.findMany({
    where: { isArchived: false, NOT: { size: null } },
    select: { size: true },
    distinct: ['size']
  })

  return {
    items,
    categories: distinctCategories.map(c => c.category),
    types: distinctTypes.map(t => t.type),
    sizes: distinctSizes.map(s => s.size).filter(Boolean) as string[]
  }
}

export async function addInventoryItem(data: any) {
  try {
    const item = await prisma.inventory.create({
      data: {
        name: data.name,
        size: data.size || null,
        type: data.type,
        unit: data.unit,
        stockLevel: parseInt(data.stockLevel),
        lowStockThreshold: parseInt(data.lowStockThreshold),
        category: data.category,
        designUrl: data.designUrl || null,
        stockLogs: {
          create: {
            oldLevel: 0,
            newLevel: parseInt(data.stockLevel),
            change: parseInt(data.stockLevel),
            type: "Initial"
          }
        }
      }
    })

    revalidatePath("/inventory")
    
    return { success: true }
  } catch (error: any) {
    console.error("Add item error:", error)
    return { success: false, error: error.message || "An unexpected error occurred." }
  }
}

export async function editInventoryItem(id: string, data: any) {
  try {
    await prisma.inventory.update({
      where: { id },
      data: {
        name: data.name,
        size: data.size || null,
        type: data.type,
        unit: data.unit,
        lowStockThreshold: parseInt(data.lowStockThreshold),
        category: data.category,
        designUrl: data.designUrl !== undefined ? (data.designUrl || null) : undefined
      }
    })

    revalidatePath("/inventory")
    
    return { success: true }
  } catch (error: any) {
    console.error("Edit item error:", error)
    return { success: false, error: error.message || "An unexpected error occurred." }
  }
}


export async function deleteInventoryItem(id: string) {
  try {
    // Attempt hard delete first
    await prisma.inventory.delete({ where: { id } })
    revalidatePath("/inventory")
    return { success: true }
  } catch (error: any) {
    // If it has history (P2003 error or generic check), we soft delete (archive) it
    try {
      await prisma.inventory.update({
        where: { id },
        data: { isArchived: true }
      })
      revalidatePath("/inventory")
      return { success: true, archived: true }
    } catch (updateError) {
      console.error("Archive error:", updateError)
      return { success: false, error: "Failed to remove item from active inventory." }
    }
  }
}

export async function updateInventoryStock(id: string, adjustment: number) {
  const current = await prisma.inventory.findUnique({
    where: { id },
    select: { stockLevel: true }
  })

  if (!current) return

  const newLevel = current.stockLevel + adjustment

  await prisma.inventory.update({
    where: { id },
    data: { stockLevel: newLevel }
  })

  await prisma.stockLog.create({
    data: {
      inventoryId: id,
      oldLevel: current.stockLevel,
      newLevel: newLevel,
      change: adjustment,
      type: "Manual Update"
    }
  })

  revalidatePath("/inventory")
}

export async function createBill(data: { customerName: string; customerPhone?: string; totalAmount: number; finalNetAmount?: number; items: { itemId?: string; name: string; unit: string; quantity: number; price: number; adhocMode?: string | null }[] }) {
  // Generate Invoice Number
  const lastBill = await prisma.bill.findFirst({
    where: { NOT: { invoiceNo: null } },
    orderBy: { createdAt: 'desc' }
  })

  let nextNo = 1001
  if (lastBill?.invoiceNo) {
    const match = lastBill.invoiceNo.match(/INV-(\d+)/)
    if (match) {
      nextNo = parseInt(match[1]) + 1
    }
  }
  const invoiceNo = `INV-${nextNo}`

  const bill = await prisma.bill.create({
    data: {
      invoiceNo,
      customerName: data.customerName,
      customerPhone: data.customerPhone || null,
      totalAmount: data.totalAmount,
      finalNetAmount: data.finalNetAmount !== undefined ? data.finalNetAmount : data.totalAmount,
      items: {
        create: data.items.map(i => ({
          itemId: i.itemId || null,
          name: i.name,
          unit: i.unit,
          quantity: i.quantity,
          price: i.price,
          adhocMode: i.adhocMode || null
        }))
      }
    }
  })

  for (const item of data.items) {
    if (!item.itemId) continue // Skip stock deduction for ad-hoc items

    const inv = await prisma.inventory.findUnique({ where: { id: item.itemId }, select: { stockLevel: true } })
    
    await prisma.inventory.update({
      where: { id: item.itemId },
      data: { stockLevel: { decrement: item.quantity } }
    })

    if (inv) {
      await prisma.stockLog.create({
        data: {
          inventoryId: item.itemId,
          oldLevel: inv.stockLevel,
          newLevel: inv.stockLevel - item.quantity,
          change: -item.quantity,
          type: "Sale"
        }
      })
    }
  }
  revalidatePath("/billing")
  revalidatePath("/inventory")
}

export async function updateBill(id: string, data: { customerName: string; customerPhone?: string; totalAmount: number; finalNetAmount?: number; items: { itemId?: string; name: string; unit: string; quantity: number; price: number; adhocMode?: string | null }[] }) {
  const oldBill = await prisma.bill.findUnique({
    where: { id },
    include: { items: true }
  })
  if (oldBill) {
    for (const item of oldBill.items) {
      if (!item.itemId) continue;
      const inv = await prisma.inventory.findUnique({ where: { id: item.itemId }, select: { stockLevel: true } })
      
      await prisma.inventory.update({
        where: { id: item.itemId },
        data: { stockLevel: { increment: item.quantity } }
      })

      if (inv) {
        await prisma.stockLog.create({
          data: {
            inventoryId: item.itemId,
            oldLevel: inv.stockLevel,
            newLevel: inv.stockLevel + item.quantity,
            change: item.quantity,
            type: "Edit Reversal"
          }
        })
      }
    }
  }

  await prisma.billItem.deleteMany({ where: { billId: id } })

  const bill = await prisma.bill.update({
    where: { id },
    data: {
      customerName: data.customerName,
      customerPhone: data.customerPhone || null,
      totalAmount: data.totalAmount,
      finalNetAmount: data.finalNetAmount !== undefined ? data.finalNetAmount : data.totalAmount,
      items: {
        create: data.items.map(i => ({
          itemId: i.itemId || null,
          name: i.name,
          unit: i.unit,
          quantity: i.quantity,
          price: i.price,
          adhocMode: i.adhocMode || null
        }))
      }
    }
  })

  for (const item of data.items) {
    if (!item.itemId) continue

    const inv = await prisma.inventory.findUnique({ where: { id: item.itemId }, select: { stockLevel: true } })
    
    await prisma.inventory.update({
      where: { id: item.itemId },
      data: { stockLevel: { decrement: item.quantity } }
    })

    if (inv) {
      await prisma.stockLog.create({
        data: {
          inventoryId: item.itemId,
          oldLevel: inv.stockLevel,
          newLevel: inv.stockLevel - item.quantity,
          change: -item.quantity,
          type: "Sale Edit"
        }
      })
    }
  }

  revalidatePath("/billing")
  revalidatePath("/inventory")
  return bill
}

export async function getBills() {
  return await prisma.bill.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { item: true } }
    }
  })
}

export async function deleteBill(id: string) {
  // Restore stock for each item in the bill
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { items: true }
  })
  if (bill) {
    for (const item of bill.items) {
      if (!item.itemId) continue; // Skip stock restoration for ad-hoc items
      const inv = await prisma.inventory.findUnique({ where: { id: item.itemId }, select: { stockLevel: true } })
      
      await prisma.inventory.update({
        where: { id: item.itemId },
        data: { stockLevel: { increment: item.quantity } }
      })

      if (inv) {
        await prisma.stockLog.create({
          data: {
            inventoryId: item.itemId,
            oldLevel: inv.stockLevel,
            newLevel: inv.stockLevel + item.quantity,
            change: item.quantity,
            type: "Restoration"
          }
        })
      }
    }
  }
  // Delete bill items first, then the bill
  await prisma.billItem.deleteMany({ where: { billId: id } })
  await prisma.bill.delete({ where: { id } })
  revalidatePath("/billing")
  revalidatePath("/inventory")
}

export async function getDashboardStats(month?: number, year?: number) {
  const inventory = await prisma.inventory.findMany({
    where: { isArchived: false }
  })
  
  // Total Boxes Across All Items
  const totalBoxes = inventory.reduce((sum, item) => sum + item.stockLevel, 0)

  // Stock Breakdown: Group by Category and Size
  const categoryMap: Record<string, { boxes: number, unit: string }> = {}
  const sizeMap: Record<string, { boxes: number, unit: string }> = {}
  let tilesStock = 0
  let sanitaryStock = 0

  inventory.forEach(item => {
    // Category mapping
    const catLabel = item.category || "Other"
    if (!categoryMap[catLabel]) {
      categoryMap[catLabel] = { boxes: 0, unit: item.unit }
    }
    categoryMap[catLabel].boxes += item.stockLevel

    // Size mapping (only if it has a size, group sanitary items/empty sizes under "Other")
    const sizeLabel = item.size?.trim() || "Other"
    if (!sizeMap[sizeLabel]) {
      sizeMap[sizeLabel] = { boxes: 0, unit: item.unit }
    }
    sizeMap[sizeLabel].boxes += item.stockLevel

    // Classify for the top card totals
    const isSan = catLabel.toLowerCase().includes("sanitary") || 
                  item.name.toLowerCase().includes("sanitary") || 
                  catLabel.toLowerCase().includes("basin") || 
                  catLabel.toLowerCase().includes("commode") || 
                  catLabel.toLowerCase().includes("sink") || 
                  catLabel.toLowerCase().includes("toilet") || 
                  catLabel.toLowerCase().includes("tap") || 
                  catLabel.toLowerCase().includes("faucet") || 
                  catLabel.toLowerCase().includes("bath")

    if (isSan) {
      sanitaryStock += item.stockLevel
    } else {
      tilesStock += item.stockLevel
    }
  })

  const stockByCategory = Object.entries(categoryMap)
    .map(([category, data]) => ({ category, boxes: data.boxes, unit: data.unit }))
    .sort((a, b) => b.boxes - a.boxes)

  const stockBySize = Object.entries(sizeMap)
    .map(([size, data]) => ({ size, boxes: data.boxes, unit: data.unit }))
    .sort((a, b) => b.boxes - a.boxes)

  // Selected Month helper
  const now = new Date()
  const selectedMonth = month !== undefined ? month : now.getMonth()
  const selectedYear = year !== undefined ? year : now.getFullYear()

  const startDate = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0)
  const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999)

  // Fetch all bills created in this selected month with their items
  const monthlyBills = await prisma.bill.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      items: {
        include: {
          item: true
        }
      }
    }
  })

  // Helpers to categorize tiles vs sanitary
  const isTile = (name: string, category?: string | null) => {
    const catLower = (category || "").toLowerCase()
    const nameLower = name.toLowerCase()
    return catLower.includes("tile") || nameLower.includes("tile") || catLower.includes("room") || catLower.includes("floor") || catLower.includes("wall")
  };

  const isSanitary = (name: string, category?: string | null) => {
    const catLower = (category || "").toLowerCase()
    const nameLower = name.toLowerCase()
    return catLower.includes("sanitary") || nameLower.includes("sanitary") || catLower.includes("basin") || catLower.includes("commode") || catLower.includes("sink") || catLower.includes("toilet") || catLower.includes("tap") || catLower.includes("faucet") || catLower.includes("bath")
  };

  const getAdhocTileCategory = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes("matte")) return "Matte Tiles"
    if (nameLower.includes("glossy") || nameLower.includes("polish")) return "Glossy Tiles"
    if (nameLower.includes("parking")) return "Parking Tiles"
    if (nameLower.includes("elevation")) return "Elevation Tiles"
    if (nameLower.includes("carving")) return "Carving Tiles"
    if (nameLower.includes("poster")) return "Poster Tiles"
    if (nameLower.includes("wall")) return "Wall Tiles"
    if (nameLower.includes("floor")) return "Floor Tiles"
    if (nameLower.includes("gvt") || nameLower.includes("pgvt")) return "GVT/PGVT Tiles"
    return "Ad-hoc/Wholesale Tiles"
  };

  const getAdhocSanitaryCategory = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes("basin")) return "Basins"
    if (nameLower.includes("commode") || nameLower.includes("closet")) return "Commodes"
    if (nameLower.includes("sink")) return "Sinks"
    if (nameLower.includes("tap") || nameLower.includes("faucet")) return "Taps & Faucets"
    return "Ad-hoc Sanitary"
  };

  let monthlyRevenue = 0
  let monthlyTilesSold = 0
  let monthlySanitarySold = 0

  const categoriesBreakdown: Record<string, number> = {}

  monthlyBills.forEach(bill => {
    // Add revenue using finalNetAmount if specified, else fall back to totalAmount
    monthlyRevenue += bill.finalNetAmount !== null && bill.finalNetAmount !== undefined ? bill.finalNetAmount : bill.totalAmount

    bill.items.forEach(item => {
      const qty = item.quantity
      const name = item.name

      if (item.item) {
        const cat = item.item.category || "Other"
        categoriesBreakdown[cat] = (categoriesBreakdown[cat] || 0) + qty
        if (isSanitary(name, cat)) {
          monthlySanitarySold += qty
        } else {
          monthlyTilesSold += qty
        }
      } else {
        // Ad-hoc wholesale or supplier item based on explicit manual toggle
        if (item.adhocMode === "sanitary") {
          monthlySanitarySold += qty
          const adhocCat = getAdhocSanitaryCategory(name)
          categoriesBreakdown[adhocCat] = (categoriesBreakdown[adhocCat] || 0) + qty
        } else if (item.adhocMode === "tile") {
          monthlyTilesSold += qty
          const adhocCat = getAdhocTileCategory(name)
          categoriesBreakdown[adhocCat] = (categoriesBreakdown[adhocCat] || 0) + qty
        }
      }
    })
  })

  const lowStockItems = inventory.filter(item => item.stockLevel <= item.lowStockThreshold)
  
  return {
    totalItems: inventory.length,
    totalBoxes,
    tilesStock,
    sanitaryStock,
    stockByCategory,
    stockBySize,
    monthlyRevenue,
    monthlyBillsCount: monthlyBills.length,
    monthlyTilesSold,
    monthlySanitarySold,
    categoriesBreakdown: Object.entries(categoriesBreakdown).map(([category, quantity]) => ({ category, quantity })).sort((a, b) => b.quantity - a.quantity),
    lowStockItems,
  }
}

export async function getMonthlyRevenue(month: number, year: number) {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59)

  const data = await prisma.bill.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: { totalAmount: true }
  })
  return data._sum.totalAmount || 0
}

export async function getStockLogs(inventoryId: string) {
  return await prisma.stockLog.findMany({
    where: { inventoryId },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit to last 50 entries
  })
}

export async function backfillInvoiceNumbers() {
  const bills = await prisma.bill.findMany({
    where: { invoiceNo: null },
    orderBy: { createdAt: 'asc' }
  })

  let nextNo = 1001
  for (const bill of bills) {
    await prisma.bill.update({
      where: { id: bill.id },
      data: { invoiceNo: `INV-${nextNo}` }
    })
    nextNo++
  }
}

// ----- GST Billing Module -----

export async function getBuyers() {
  return await prisma.buyer.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function upsertBuyer(data: any) {
  if (data.id) {
    const res = await prisma.buyer.update({
      where: { id: data.id },
      data: {
        name: data.name,
        gstNumber: data.gstNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        phone: data.phone
      }
    })
    revalidatePath("/gst-billing")
    return res
  } else {
    const res = await prisma.buyer.create({
      data: {
        name: data.name,
        gstNumber: data.gstNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        phone: data.phone
      }
    })
    revalidatePath("/gst-billing")
    return res
  }
}

export async function deleteBuyer(id: string) {
  await prisma.buyer.delete({ where: { id } })
  revalidatePath("/gst-billing")
}

export async function createTaxInvoice(data: any) {
  // 1. Generate invoice number if not provided
  let invoiceNo = data.invoiceNo;
  if (!invoiceNo) {
    const lastInvoice = await prisma.taxInvoice.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    const lastNo = lastInvoice ? parseInt(lastInvoice.invoiceNo.replace(/\D/g, '')) || 0 : 0
    invoiceNo = String(lastNo + 1).padStart(3, '0')
  }

  // 2. Create the invoice
  const invoice = await prisma.taxInvoice.create({
    data: {
      invoiceNo: invoiceNo,
      date: data.date ? new Date(data.date) : new Date(),
      buyerName: data.buyerName,
      buyerGst: data.buyerGst,
      buyerAddress: data.buyerAddress,
      buyerPhone: data.buyerPhone,
      placeOfSupply: data.placeOfSupply,
      paymentMode: data.paymentMode,
      totalBaseAmount: data.totalBaseAmount,
      totalTaxAmount: data.totalTaxAmount,
      grandTotal: data.grandTotal,
      buyerId: data.buyerId,
      vehicleNo: data.vehicleNo,
      transport: data.transport,
      lrNo: data.lrNo,
      items: {
        create: data.items.map((item: any) => ({
          name: item.name,
          size: item.size,
          unit: item.unit,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          price: item.price,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount
        }))
      }
    }
  })

  // Auto-sync buyer to library
  if (data.buyerName) {
    await prisma.buyer.upsert({
      where: { name: data.buyerName },
      update: {
        gstNumber: data.buyerGst || undefined,
        phone: data.buyerPhone || undefined,
        address: data.buyerAddress || undefined,
        state: data.placeOfSupply || undefined,
      },
      create: {
        name: data.buyerName,
        gstNumber: data.buyerGst || '',
        phone: data.buyerPhone || '',
        address: data.buyerAddress || '',
        state: data.placeOfSupply || 'Telangana',
      }
    })
  }

  // Auto-sync items to TaxProduct library
  for (const item of data.items) {
    if (item.name && item.hsnCode) {
      await prisma.taxProduct.upsert({
        where: { name: item.name },
        update: { hsnCode: item.hsnCode },
        create: { name: item.name, hsnCode: item.hsnCode }
      })
    }
  }

  return invoice
}

export async function getTaxInvoices() {
  return await prisma.taxInvoice.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  })
}

export async function deleteTaxInvoice(id: string) {
  await prisma.taxInvoice.delete({ where: { id } })
  revalidatePath("/gst-billing")
}

export async function updateTaxInvoice(id: string, data: any) {
  const { items, date, invoiceNo, ...invoiceData } = data
  
  // 1. Delete existing items
  await prisma.taxInvoiceItem.deleteMany({
    where: { invoiceId: id }
  })
  
  // 2. Update invoice header and create new items
  await prisma.taxInvoice.update({
    where: { id },
    data: {
      ...invoiceData,
      invoiceNo: invoiceNo || undefined,
      date: date ? new Date(date) : undefined,
      buyerId: invoiceData.buyerId,
      vehicleNo: invoiceData.vehicleNo,
      transport: invoiceData.transport,
      lrNo: invoiceData.lrNo,
      items: {
        create: items.map((item: any) => ({
          name: item.name,
          size: item.size,
          unit: item.unit,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          price: item.price,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount
        }))
      }
    }
  })

  // Auto-sync buyer to library
  if (invoiceData.buyerName) {
    await prisma.buyer.upsert({
      where: { name: invoiceData.buyerName },
      update: {
        gstNumber: invoiceData.buyerGst || undefined,
        phone: invoiceData.buyerPhone || undefined,
        address: invoiceData.buyerAddress || undefined,
        state: invoiceData.placeOfSupply || undefined,
      },
      create: {
        name: invoiceData.buyerName,
        gstNumber: invoiceData.buyerGst || '',
        phone: invoiceData.buyerPhone || '',
        address: invoiceData.buyerAddress || '',
        state: invoiceData.placeOfSupply || 'Telangana',
      }
    })
  }

  // Auto-sync items to TaxProduct library
  for (const item of items) {
    if (item.name && item.hsnCode) {
      await prisma.taxProduct.upsert({
        where: { name: item.name },
        update: { hsnCode: item.hsnCode },
        create: { name: item.name, hsnCode: item.hsnCode }
      })
    }
  }

  revalidatePath("/gst-billing")
}

export async function getTaxProducts() {
  return await prisma.taxProduct.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function upsertTaxProduct(data: any) {
  const { id, ...rest } = data
  if (id) {
    await prisma.taxProduct.update({ where: { id }, data: rest })
  } else {
    await prisma.taxProduct.create({ data: rest })
  }
  revalidatePath("/gst-billing")
}

export async function deleteTaxProduct(id: string) {
  await prisma.taxProduct.delete({ where: { id } })
  revalidatePath("/gst-billing")
}

/* ═══════════════════════════════════════════════════════
   PURCHASE LEDGER ACTIONS
════════════════════════════════════════════════════════ */

export async function getPurchaseParties() {
  const parties = await prisma.purchaseParty.findMany({
    orderBy: { name: 'asc' },
    include: {
      entries: true
    }
  })

  return parties.map(party => {
    const totalDebit = party.entries.reduce((acc, e) => acc + (e.debit || 0), 0)
    const totalCredit = party.entries.reduce((acc, e) => acc + (e.credit || 0), 0)
    const balance = totalDebit - totalCredit
    return {
      id: party.id,
      name: party.name,
      createdAt: party.createdAt,
      totalDebit,
      totalCredit,
      latestBalance: Math.abs(balance),
      rawBalance: balance,
      balanceType: balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : 'Nil',
      entriesCount: party.entries.length
    }
  })
}

export async function createPurchaseParty(name: string) {
  try {
    const trimmedName = name.trim()
    const existing = await prisma.purchaseParty.findUnique({
      where: { name: trimmedName }
    })
    if (existing) {
      return { success: false, error: "A supplier party with this name already exists." }
    }

    const party = await prisma.purchaseParty.create({
      data: { name: trimmedName }
    })
    revalidatePath("/purchase-ledger")
    return { success: true, party }
  } catch (err: any) {
    console.error("Error creating purchase party:", err)
    return { success: false, error: err.message || "Could not add party. Please try again." }
  }
}

export async function getPurchasePartyById(id: string) {
  const party = await prisma.purchaseParty.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: [
          { date: 'asc' },
          { createdAt: 'asc' }
        ]
      }
    }
  })

  if (!party) return null

  let runningBalance = 0
  const entriesWithBalance = party.entries.map((entry, index) => {
    runningBalance += (entry.debit || 0) - (entry.credit || 0)
    return {
      ...entry,
      serialNo: index + 1,
      runningBalance: Math.abs(runningBalance),
      rawRunningBalance: runningBalance,
      balanceType: runningBalance > 0 ? 'Dr' : runningBalance < 0 ? 'Cr' : 'Nil'
    }
  })

  return {
    id: party.id,
    name: party.name,
    createdAt: party.createdAt,
    entries: entriesWithBalance,
    currentBalance: Math.abs(runningBalance),
    rawCurrentBalance: runningBalance,
    balanceType: runningBalance > 0 ? 'Dr' : runningBalance < 0 ? 'Cr' : 'Nil'
  }
}

export async function createPurchaseEntry(data: {
  partyId: string
  date: string | Date
  narration: string
  debit?: number
  credit?: number
}) {
  const debitVal = data.debit || 0
  const creditVal = data.credit || 0
  if (debitVal > 0 && creditVal > 0) {
    throw new Error("You cannot enter both Credit and Debit in a single entry. Please create a separate entry or one more entry.")
  }
  if (debitVal <= 0 && creditVal <= 0) {
    throw new Error("Please enter either a Debit or Credit amount greater than 0.")
  }
  const entry = await prisma.purchaseLedgerEntry.create({
    data: {
      partyId: data.partyId,
      date: new Date(data.date),
      narration: data.narration.trim(),
      debit: debitVal,
      credit: creditVal
    }
  })
  revalidatePath("/purchase-ledger")
  revalidatePath(`/purchase-ledger/${data.partyId}`)
  return entry
}

export async function deletePurchaseEntry(entryId: string, partyId: string) {
  await prisma.purchaseLedgerEntry.delete({
    where: { id: entryId }
  })
  revalidatePath("/purchase-ledger")
  revalidatePath(`/purchase-ledger/${partyId}`)
}

export async function updatePurchaseParty(id: string, name: string) {
  const party = await prisma.purchaseParty.update({
    where: { id },
    data: { name: name.trim() }
  })
  revalidatePath("/purchase-ledger")
  revalidatePath(`/purchase-ledger/${id}`)
  return party
}

export async function updatePurchaseEntry(
  entryId: string,
  partyId: string,
  data: {
    date: string | Date
    narration: string
    debit?: number
    credit?: number
  }
) {
  const debitVal = data.debit || 0
  const creditVal = data.credit || 0
  if (debitVal > 0 && creditVal > 0) {
    throw new Error("You cannot enter both Credit and Debit in a single entry. Please create a separate entry or one more entry.")
  }
  if (debitVal <= 0 && creditVal <= 0) {
    throw new Error("Please enter either a Debit or Credit amount greater than 0.")
  }
  const entry = await prisma.purchaseLedgerEntry.update({
    where: { id: entryId },
    data: {
      date: new Date(data.date),
      narration: data.narration.trim(),
      debit: debitVal,
      credit: creditVal
    }
  })
  revalidatePath("/purchase-ledger")
  revalidatePath(`/purchase-ledger/${partyId}`)
  return entry
}

/* ═══════════════════════════════════════════════════════
   B2B PARTNERS LEDGER ACTIONS
════════════════════════════════════════════════════════ */

export async function getB2BParties() {
  const parties = await prisma.b2BParty.findMany({
    orderBy: { name: 'asc' },
    include: {
      entries: true
    }
  })

  return parties.map(party => {
    const totalDebit = party.entries.reduce((acc, e) => acc + (e.debit || 0), 0)
    const totalCredit = party.entries.reduce((acc, e) => acc + (e.credit || 0), 0)
    const balance = totalDebit - totalCredit
    return {
      id: party.id,
      name: party.name,
      createdAt: party.createdAt,
      totalDebit,
      totalCredit,
      latestBalance: Math.abs(balance),
      rawBalance: balance,
      balanceType: balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : 'Nil',
      entriesCount: party.entries.length
    }
  })
}

export async function createB2BParty(name: string) {
  try {
    const trimmedName = name.trim()
    const existing = await prisma.b2BParty.findUnique({
      where: { name: trimmedName }
    })
    if (existing) {
      return { success: false, error: "A B2B party with this name already exists." }
    }

    const party = await prisma.b2BParty.create({
      data: { name: trimmedName }
    })
    revalidatePath("/b2b-ledger")
    return { success: true, party }
  } catch (err: any) {
    console.error("Error creating B2B party:", err)
    return { success: false, error: err.message || "Could not add party. Please try again." }
  }
}

export async function getB2BPartyById(id: string) {
  const party = await prisma.b2BParty.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: [
          { date: 'asc' },
          { createdAt: 'asc' }
        ]
      }
    }
  })

  if (!party) return null

  let runningBalance = 0
  const entriesWithBalance = party.entries.map((entry, index) => {
    runningBalance += (entry.debit || 0) - (entry.credit || 0)
    return {
      ...entry,
      serialNo: index + 1,
      runningBalance: Math.abs(runningBalance),
      rawRunningBalance: runningBalance,
      balanceType: runningBalance > 0 ? 'Dr' : runningBalance < 0 ? 'Cr' : 'Nil'
    }
  })

  return {
    id: party.id,
    name: party.name,
    createdAt: party.createdAt,
    entries: entriesWithBalance,
    currentBalance: Math.abs(runningBalance),
    rawCurrentBalance: runningBalance,
    balanceType: runningBalance > 0 ? 'Dr' : runningBalance < 0 ? 'Cr' : 'Nil'
  }
}

export async function createB2BEntry(data: {
  partyId: string
  date: string | Date
  narration: string
  debit?: number
  credit?: number
}) {
  const debitVal = data.debit || 0
  const creditVal = data.credit || 0
  if (debitVal > 0 && creditVal > 0) {
    throw new Error("You cannot enter both Credit and Debit in a single entry. Please create a separate entry or one more entry.")
  }
  if (debitVal <= 0 && creditVal <= 0) {
    throw new Error("Please enter either a Debit or Credit amount greater than 0.")
  }
  const entry = await prisma.b2BLedgerEntry.create({
    data: {
      partyId: data.partyId,
      date: new Date(data.date),
      narration: data.narration.trim(),
      debit: debitVal,
      credit: creditVal
    }
  })
  revalidatePath("/b2b-ledger")
  revalidatePath(`/b2b-ledger/${data.partyId}`)
  return entry
}

export async function deleteB2BEntry(entryId: string, partyId: string) {
  await prisma.b2BLedgerEntry.delete({
    where: { id: entryId }
  })
  revalidatePath("/b2b-ledger")
  revalidatePath(`/b2b-ledger/${partyId}`)
}

export async function updateB2BParty(id: string, name: string) {
  const party = await prisma.b2BParty.update({
    where: { id },
    data: { name: name.trim() }
  })
  revalidatePath("/b2b-ledger")
  revalidatePath(`/b2b-ledger/${id}`)
  return party
}

export async function updateB2BEntry(
  entryId: string,
  partyId: string,
  data: {
    date: string | Date
    narration: string
    debit?: number
    credit?: number
  }
) {
  const debitVal = data.debit || 0
  const creditVal = data.credit || 0
  if (debitVal > 0 && creditVal > 0) {
    throw new Error("You cannot enter both Credit and Debit in a single entry. Please create a separate entry or one more entry.")
  }
  if (debitVal <= 0 && creditVal <= 0) {
    throw new Error("Please enter either a Debit or Credit amount greater than 0.")
  }
  const entry = await prisma.b2BLedgerEntry.update({
    where: { id: entryId },
    data: {
      date: new Date(data.date),
      narration: data.narration.trim(),
      debit: debitVal,
      credit: creditVal
    }
  })
  revalidatePath("/b2b-ledger")
  revalidatePath(`/b2b-ledger/${partyId}`)
  return entry
}

// ==========================================
// DYNAMIC QR CODE STUDIO ACTIONS
// ==========================================

export async function getDynamicQRs(category?: string, search?: string) {
  const where: any = {}
  if (category && category !== "All") {
    where.category = category
  }
  if (search && search.trim() !== "") {
    where.OR = [
      { title: { contains: search } },
      { code: { contains: search } },
      { targetUrl: { contains: search } }
    ]
  }
  return await prisma.dynamicQR.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
}

export async function createDynamicQR(data: {
  code: string
  title: string
  category: string
  targetUrl: string
  description?: string
}) {
  const cleanCode = data.code
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")

  if (!cleanCode) {
    throw new Error("Please enter a valid short code slug.")
  }

  const existing = await prisma.dynamicQR.findUnique({
    where: { code: cleanCode }
  })
  if (existing) {
    throw new Error(`The QR code slug '${cleanCode}' is already in use. Please choose another code.`)
  }

  let targetUrl = data.targetUrl.trim()
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`
  }

  const qr = await prisma.dynamicQR.create({
    data: {
      code: cleanCode,
      title: data.title.trim(),
      category: data.category || "General",
      targetUrl,
      description: data.description?.trim() || null
    }
  })
  revalidatePath("/qr-studio")
  return qr
}

export async function updateDynamicQR(id: string, data: {
  title?: string
  targetUrl?: string
  category?: string
  description?: string
  isActive?: boolean
}) {
  const updateData: any = {}
  if (data.title !== undefined) updateData.title = data.title.trim()
  if (data.category !== undefined) updateData.category = data.category
  if (data.description !== undefined) updateData.description = data.description.trim()
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.targetUrl !== undefined) {
    let targetUrl = data.targetUrl.trim()
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`
    }
    updateData.targetUrl = targetUrl
  }

  const qr = await prisma.dynamicQR.update({
    where: { id },
    data: updateData
  })
  revalidatePath("/qr-studio")
  return qr
}

export async function deleteDynamicQR(id: string) {
  await prisma.dynamicQR.delete({ where: { id } })
  revalidatePath("/qr-studio")
}

export async function getLatestPurchaseEntries() {
  const entries = await prisma.purchaseLedgerEntry.findMany({
    take: 7,
    orderBy: { createdAt: 'desc' },
    include: {
      party: {
        select: {
          name: true
        }
      }
    }
  })
  return entries
}

export async function getLatestB2BEntries() {
  const entries = await prisma.b2BLedgerEntry.findMany({
    take: 7,
    orderBy: { createdAt: 'desc' },
    include: {
      party: {
        select: {
          name: true
        }
      }
    }
  })
  return entries
}

