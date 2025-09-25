import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { parseGiftCodeText } from '@/lib/parse'

export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { rawText, batchTitle } = await req.json()
    
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { error: 'テキストが提供されていません' },
        { status: 400 }
      )
    }

    // テキストを解析
    const parseResult = parseGiftCodeText(rawText)
    const validCodes = parseResult.codes.filter(c => c.isValid)

    if (validCodes.length === 0) {
      return NextResponse.json(
        { error: '有効なギフトコードが見つかりませんでした' },
        { status: 400 }
      )
    }

    // 現在はデータベースへの実際の保存をスキップして、
    // 解析結果のみを返す（デモ用）
    console.log('Parsed gift codes:', validCodes.length)
    console.log('Total amount:', parseResult.totalAmount)

    // 成功レスポンス（デモ用）
    return NextResponse.json({
      success: true,
      inserted: validCodes.length,
      skipped: 0,
      totalAmount: parseResult.totalAmount,
      message: `${validCodes.length}件のギフトコードが正常に解析されました（デモモード）`,
      demo: true
    })
  } catch (error: any) {
    console.error('Commit error:', error)
    
    return NextResponse.json(
      { 
        error: '処理中にエラーが発生しました',
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    )
  }
}
