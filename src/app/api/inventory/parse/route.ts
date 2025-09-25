import { NextRequest, NextResponse } from 'next/server'
import { parseGiftCodeText } from '@/lib/parse'

export async function POST(req: NextRequest) {
  try {
    const { rawText } = await req.json()
    
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'テキストが提供されていません' },
        { status: 400 }
      )
    }

    const result = parseGiftCodeText(rawText)
    
    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { error: '解析中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
