import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const localAdapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db"
})
const prisma = new PrismaClient({ adapter: localAdapter })

async function main() {
  console.log('Clearing existing database data to prevent duplicates...')
  await prisma.taxInvoiceItem.deleteMany()
  await prisma.taxInvoice.deleteMany()
  await prisma.buyer.deleteMany()
  await prisma.taxProduct.deleteMany()
  await prisma.billItem.deleteMany()
  await prisma.bill.deleteMany()
  await prisma.stockLog.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.systemSetting.deleteMany()

  console.log('Seeding System Settings...')
  await prisma.systemSetting.createMany({
    data: [
      { key: 'company_name', value: 'Patel Tiles Ceramic' },
      { key: 'gstin', value: '36AAPPC9988E1Z9' },
      { key: 'address', value: 'S.No. 104, Ceramic Market Road, Hyderabad, Telangana - 500072' },
      { key: 'phone', value: '+91 98765 43210' },
      { key: 'email', value: 'contact@pateltilesceramic.com' }
    ]
  })

  console.log('Seeding Tax Products (HSN Codes)...')
  await prisma.taxProduct.createMany({
    data: [
      { name: 'Vitrified / Porcelain Floor Tiles', hsnCode: '69072100' },
      { name: 'Ceramic Glazed Wall Tiles', hsnCode: '69072200' },
      { name: 'Parking & Elevation Rustic Tiles', hsnCode: '69072300' },
      { name: 'Sanitaryware (Wash Basin / Commode)', hsnCode: '69101000' },
      { name: 'Brass Bathroom Fittings & Taps', hsnCode: '84818020' },
      { name: 'Tile Adhesive & Epoxy Grout', hsnCode: '38245010' }
    ]
  })

  console.log('Seeding Buyers...')
  const buyer1 = await prisma.buyer.create({
    data: {
      name: 'Sri Sai Constructions & Developers',
      gstNumber: '36AABCS1234D1Z2',
      address: 'Plot 42, Jubilee Hills, Road No. 36',
      city: 'Hyderabad',
      state: 'Telangana',
      phone: '9848012345'
    }
  })

  const buyer2 = await prisma.buyer.create({
    data: {
      name: 'Mahalakshmi Enterprises & Interiors',
      gstNumber: '36XYZPK9876M1Z8',
      address: 'Shop 12, Main Road, Kukatpally',
      city: 'Hyderabad',
      state: 'Telangana',
      phone: '9700011223'
    }
  })

  const buyer3 = await prisma.buyer.create({
    data: {
      name: 'Rajesh Sharma (Retail Customer)',
      gstNumber: null,
      address: 'Villa 14, Gachibowli Phase 2',
      city: 'Hyderabad',
      state: 'Telangana',
      phone: '9988776655'
    }
  })

  console.log('Seeding Inventory Items...')
  const inventoryItems = [
    {
      name: 'Royal Carrara White Marble Finish',
      size: '600x1200mm',
      type: 'Glossy',
      unit: 'box',
      stockLevel: 140,
      lowStockThreshold: 30,
      category: 'Floor Tiles',
      designUrl: null
    },
    {
      name: 'Statuario Premium High Depth Tile',
      size: '600x1200mm',
      type: 'High Depth',
      unit: 'box',
      stockLevel: 85,
      lowStockThreshold: 40,
      category: 'Floor Tiles',
      designUrl: null
    },
    {
      name: 'Urban Grey Cement Finish Tile',
      size: '600x600mm',
      type: 'Matte',
      unit: 'box',
      stockLevel: 25, // Low stock
      lowStockThreshold: 50,
      category: 'Floor Tiles',
      designUrl: null
    },
    {
      name: 'Moroccan Art Decor Vintage Tile',
      size: '600x600mm',
      type: 'Satin',
      unit: 'box',
      stockLevel: 110,
      lowStockThreshold: 20,
      category: 'Floor Tiles',
      designUrl: null
    },
    {
      name: 'Onyx Aqua Blue Designer Wall Tile',
      size: '300x600mm',
      type: 'High Gloss',
      unit: 'box',
      stockLevel: 190,
      lowStockThreshold: 40,
      category: 'Wall Tiles',
      designUrl: null
    },
    {
      name: '3D Elevation Rustic Natural Stone',
      size: '300x600mm',
      type: 'Elevation Rustic',
      unit: 'box',
      stockLevel: 18, // Low stock
      lowStockThreshold: 35,
      category: 'Wall Tiles',
      designUrl: null
    },
    {
      name: 'Spanish White Metro Subway Tile',
      size: '100x300mm',
      type: 'Glossy',
      unit: 'box',
      stockLevel: 310,
      lowStockThreshold: 60,
      category: 'Wall Tiles',
      designUrl: null
    },
    {
      name: 'Heavy Duty Chequered Parking Tile',
      size: '400x400mm',
      type: 'Anti-Skid Matte',
      unit: 'box',
      stockLevel: 150,
      lowStockThreshold: 50,
      category: 'Parking Tiles',
      designUrl: null
    },
    {
      name: 'Table Top Designer Wash Basin (Oval Gold Edge)',
      size: '18x13 inch',
      type: 'Designer Ceramic',
      unit: 'pc',
      stockLevel: 14,
      lowStockThreshold: 10,
      category: 'Basins',
      designUrl: null
    },
    {
      name: 'One-Piece Wall Hung Commode (Rimless White)',
      size: 'Standard',
      type: 'Ceramic Rimless',
      unit: 'pc',
      stockLevel: 8, // Low stock
      lowStockThreshold: 10,
      category: 'Toilets',
      designUrl: null
    },
    {
      name: 'Brass Single Lever Basin Mixer Tap',
      size: 'Standard',
      type: 'Chrome Finish',
      unit: 'pc',
      stockLevel: 32,
      lowStockThreshold: 15,
      category: 'Faucets & Taps',
      designUrl: null
    },
    {
      name: 'Premium Tile Epoxy Grout & Adhesive',
      size: '20kg Bag',
      type: 'Waterproof Chemical',
      unit: 'pc',
      stockLevel: 65,
      lowStockThreshold: 20,
      category: 'Adhesives & Chemicals',
      designUrl: null
    }
  ]

  const createdInventory: Record<string, any> = {}
  for (const item of inventoryItems) {
    const inv = await prisma.inventory.create({ data: item })
    createdInventory[inv.name] = inv

    // Create initial stock log
    await prisma.stockLog.create({
      data: {
        inventoryId: inv.id,
        oldLevel: 0,
        newLevel: inv.stockLevel,
        change: inv.stockLevel,
        type: 'Initial'
      }
    })
  }

  console.log('Seeding recent Stock Logs...')
  const sampleInv1 = createdInventory['Royal Carrara White Marble Finish']
  if (sampleInv1) {
    await prisma.stockLog.create({
      data: {
        inventoryId: sampleInv1.id,
        oldLevel: 160,
        newLevel: 140,
        change: -20,
        type: 'Sale'
      }
    })
  }
  const sampleInv2 = createdInventory['Urban Grey Cement Finish Tile']
  if (sampleInv2) {
    await prisma.stockLog.create({
      data: {
        inventoryId: sampleInv2.id,
        oldLevel: 35,
        newLevel: 25,
        change: -10,
        type: 'Sale'
      }
    })
  }

  console.log('Seeding Tax Invoices...')
  const inv1 = createdInventory['Royal Carrara White Marble Finish']
  const inv2 = createdInventory['Onyx Aqua Blue Designer Wall Tile']
  if (inv1 && inv2) {
    const qty1 = 30
    const price1 = 1250
    const base1 = qty1 * price1
    const tax1 = base1 * 0.18

    const qty2 = 25
    const price2 = 850
    const base2 = qty2 * price2
    const tax2 = base2 * 0.18

    const totalBase = base1 + base2
    const totalTax = tax1 + tax2
    const grandTotal = totalBase + totalTax

    await prisma.taxInvoice.create({
      data: {
        invoiceNo: 'PTC-INV-2026-001',
        buyerId: buyer1.id,
        buyerName: buyer1.name,
        buyerGst: buyer1.gstNumber,
        buyerAddress: buyer1.address,
        buyerPhone: buyer1.phone,
        placeOfSupply: 'Telangana',
        paymentMode: 'BANK TRANSFER',
        totalBaseAmount: totalBase,
        totalTaxAmount: totalTax,
        grandTotal: grandTotal,
        vehicleNo: 'TS 09 EU 4567',
        transport: 'VRL Logistics',
        lrNo: 'LR-998877',
        items: {
          create: [
            {
              name: inv1.name,
              size: inv1.size,
              unit: inv1.unit,
              hsnCode: '69072100',
              quantity: qty1,
              price: price1,
              taxRate: 18.0,
              taxAmount: tax1
            },
            {
              name: inv2.name,
              size: inv2.size,
              unit: inv2.unit,
              hsnCode: '69072200',
              quantity: qty2,
              price: price2,
              taxRate: 18.0,
              taxAmount: tax2
            }
          ]
        }
      }
    })
  }

  console.log('Seeding Retail Bills...')
  const inv3 = createdInventory['Table Top Designer Wash Basin (Oval Gold Edge)']
  const inv4 = createdInventory['Brass Single Lever Basin Mixer Tap']
  if (inv3 && inv4) {
    await prisma.bill.create({
      data: {
        invoiceNo: 'RET-0101',
        customerName: 'Rajesh Sharma',
        customerPhone: '9988776655',
        totalAmount: 18500,
        items: {
          create: [
            {
              name: inv3.name,
              unit: inv3.unit,
              quantity: 2,
              price: 5500,
              itemId: inv3.id
            },
            {
              name: inv4.name,
              unit: inv4.unit,
              quantity: 2,
              price: 3750,
              itemId: inv4.id
            }
          ]
        }
      }
    })
  }

  console.log('Database seeded successfully with realistic Patel Tiles Ceramic data!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
