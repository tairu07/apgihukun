import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { encrypt, hmac } from '@/server/crypto'
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

    let insertedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // 各ギフトコードを登録
    for (const codeData of validCodes) {
      try {
        const codeHash = hmac(codeData.code)
        const encryptedCode = encrypt(codeData.code)

        // Supabaseのテーブル名に合わせて修正
        await prisma.giftCode.create({
          data: {
            code: codeData.code, // 元のコード（マスク表示用）
            amount: codeData.amount,
            encryptedCode: encryptedCode,
            codeHash: codeHash,
            status: 'available',
          }
        })
        
        insertedCount++
      } catch (error: any) {
        console.error('Individual code error:', error)
        // 一意制約違反（重複）の場合はスキップ
        if (error.code === 'P2002') {
          skippedCount++
        } else {
          errors.push(`コード ${codeData.code.substring(0, 4)}****: ${error.message}`)
        }
      }
    }

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      totalAmount: parseResult.totalAmount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Commit error:', error)
    
    // より詳細なエラー情報を返す
    let errorMessage = '登録中にエラーが発生しました'
    if (error.code === 'P2002') {
      errorMessage = '重複するギフトコードが検出されました'
    } else if (error.code === 'P2025') {
      errorMessage = 'データベーステーブルが見つかりません'
    } else if (error.message) {
      errorMessage = `エラー: ${error.message}`
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    )
  }
}
