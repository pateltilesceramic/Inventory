import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function numberToWordsIN(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n) || n <= 0) return ""
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  const convertLessThanOneThousand = (number: number): string => {
    let word = ""
    if (number >= 100) {
      word += ones[Math.floor(number / 100)] + " Hundred "
      number %= 100
    }
    if (number >= 20) {
      word += tens[Math.floor(number / 10)] + " "
      number %= 10
    }
    if (number > 0) {
      word += ones[number] + " "
    }
    return word.trim()
  }

  const integerPart = Math.floor(n)
  const decimalPart = Math.round((n - integerPart) * 100)

  if (integerPart === 0 && decimalPart === 0) return ""

  let result = ""
  let temp = integerPart

  if (temp >= 10000000) {
    const crores = Math.floor(temp / 10000000)
    result += convertLessThanOneThousand(crores) + " Crore "
    temp %= 10000000
  }
  if (temp >= 100000) {
    const lakhs = Math.floor(temp / 100000)
    result += convertLessThanOneThousand(lakhs) + " Lakh "
    temp %= 100000
  }
  if (temp >= 1000) {
    const thousands = Math.floor(temp / 1000)
    result += convertLessThanOneThousand(thousands) + " Thousand "
    temp %= 1000
  }
  if (temp > 0) {
    result += convertLessThanOneThousand(temp) + " "
  }

  let finalWords = result.trim() ? `${result.trim()} Rupees` : ""
  if (decimalPart > 0) {
    finalWords += (finalWords ? " and " : "") + `${convertLessThanOneThousand(decimalPart)} Paise`
  }
  return finalWords ? `${finalWords} Only` : ""
}
