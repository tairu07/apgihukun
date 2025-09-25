// テキスト解析ライブラリ - ギフトコードの貼り付けテキストを解析

export type ParsedCode = {
  code: string
  amount: number
  lineNumber: number
  isValid: boolean
  error?: string
}

export type ParseResult = {
  codes: ParsedCode[]
  totalAmount: number
  validCount: number
  invalidCount: number
  duplicateCount: number
}

/**
 * 貼り付けられたテキストからギフトコードと金額を抽出
 * @param rawText 貼り付けられたテキスト
 * @returns 解析結果
 */
export function parseGiftCodeText(rawText: string): ParseResult {
  // より柔軟な行分割処理
  const lines = rawText
    .split(/[\r\n]+/)  // 改行で分割
    .map(line => line.trim())
    .filter(line => line.length > 0)
    // 1行に複数のコードが含まれている場合の処理
    .flatMap(line => {
      // スペースが多い場合は複数のエントリに分割
      const parts = line.split(/\s{4,}/)  // 4つ以上の連続スペースで分割
      return parts.filter(part => part.trim().length > 0)
    })

  const codes: ParsedCode[] = []
  const seenCodes = new Set<string>()
  let duplicateCount = 0

  lines.forEach((line, index) => {
    const parsed = parseSingleLine(line, index + 1)
    
    if (parsed.isValid) {
      // 重複チェック
      if (seenCodes.has(parsed.code)) {
        parsed.isValid = false
        parsed.error = '重複したコードです'
        duplicateCount++
      } else {
        seenCodes.add(parsed.code)
      }
    }
    
    codes.push(parsed)
  })

  const validCodes = codes.filter(c => c.isValid)
  const totalAmount = validCodes.reduce((sum, c) => sum + c.amount, 0)

  return {
    codes,
    totalAmount,
    validCount: validCodes.length,
    invalidCount: codes.length - validCodes.length,
    duplicateCount
  }
}

/**
 * 単一行からギフトコードと金額を抽出
 */
function parseSingleLine(line: string, lineNumber: number): ParsedCode {
  // 様々な形式に対応する正規表現
  const patterns = [
    // "X9D5YZT5787Y57PG    ¥50,000" 形式（複数スペース対応）
    /^([A-Z0-9]{16})\s+[¥￥]?\s*([\d,]+)\s*円?$/i,
    // "X9D5YZT5787Y57PG¥50,000" 形式（スペースなし）
    /^([A-Z0-9]{16})[¥￥]\s*([\d,]+)\s*円?$/i,
    // "¥50,000 X9D5YZT5787Y57PG" 形式（逆順）
    /^[¥￥]?\s*([\d,]+)\s*円?\s+([A-Z0-9]{16})$/i,
    // タブ区切り "X9D5YZT5787Y57PG\t¥50,000"
    /^([A-Z0-9]{16})\t+[¥￥]?\s*([\d,]+)\s*円?$/i,
    // 非常に柔軟なパターン（16桁英数字と数字を抽出）
    /([A-Z0-9]{16}).*?[¥￥]?\s*([\d,]+)/i,
  ]

  for (const pattern of patterns) {
    const match = line.match(pattern)
    if (match) {
      let code: string
      let amountStr: string

      // パターンによって順序が異なる
      if (pattern.source.includes('([A-Z0-9]{16}).*([\\d,]+)')) {
        code = match[1]
        amountStr = match[2]
      } else {
        code = match[2]
        amountStr = match[1]
      }

      // 金額の正規化（カンマを除去）
      const amount = parseInt(amountStr.replace(/,/g, ''), 10)

      // バリデーション
      if (!isValidGiftCode(code)) {
        return {
          code,
          amount,
          lineNumber,
          isValid: false,
          error: 'ギフトコードの形式が正しくありません'
        }
      }

      if (!isValidAmount(amount)) {
        return {
          code,
          amount,
          lineNumber,
          isValid: false,
          error: '金額が正しくありません'
        }
      }

      return {
        code: code.toUpperCase(),
        amount,
        lineNumber,
        isValid: true
      }
    }
  }

  return {
    code: '',
    amount: 0,
    lineNumber,
    isValid: false,
    error: '認識できない形式です'
  }
}

/**
 * ギフトコードの形式をバリデーション
 */
function isValidGiftCode(code: string): boolean {
  // 16桁の英数字
  return /^[A-Z0-9]{16}$/i.test(code)
}

/**
 * 金額の妥当性をチェック
 */
function isValidAmount(amount: number): boolean {
  // 正の整数で、一般的なギフトカード金額の範囲内（上限を200,000に拡張）
  return Number.isInteger(amount) && amount > 0 && amount <= 200000
}

/**
 * コードをマスク表示用に変換
 * @param code ギフトコード
 * @param showFull 全体を表示するか
 * @returns マスクされたコード
 */
export function maskGiftCode(code: string, showFull: boolean = false): string {
  if (showFull || code.length <= 4) {
    return code
  }
  
  // 最初の2文字と最後の2文字を表示、中間をマスク
  const start = code.substring(0, 2)
  const end = code.substring(code.length - 2)
  const maskLength = code.length - 4
  const mask = '*'.repeat(maskLength)
  
  return `${start}${mask}${end}`
}

/**
 * 金額をフォーマット
 */
export function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString()}`
}
