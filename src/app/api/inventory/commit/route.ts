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

    // バッチレコードを作成
    const batch = await prisma.inventoryBatch.create({
      data: {
        rawText,
        importedByUserId: session.user.id,
        totalAmount: parseResult.totalAmount,
        count: validCodes.length,
      }
    })

    let insertedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // 各ギフトコードを登録
    for (const codeData of validCodes) {
      try {
        const codeHash = hmac(codeData.code)
        const codeEnc = encrypt(codeData.code)

        await prisma.giftCode.create({
          data: {
            codeEnc,
            codeHash,
            amount: codeData.amount,
            importedBatchId: batch.id,
            status: 'UNASSIGNED',
          }
        })
        
        insertedCount++
      } catch (error: any) {
        // 一意制約違反（重複）の場合はスキップ
        if (error.code === 'P2002') {
          skippedCount++
        } else {
          errors.push(`コード ${codeData.code}: ${error.message}`)
        }
      }
    }

    // 監査ログを記録
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'INVENTORY_IMPORT',
        entityType: 'InventoryBatch',
        entityId: batch.id,
        diffJson: JSON.stringify({
          totalCodes: validCodes.length,
          inserted: insertedCount,
          skipped: skippedCount,
          totalAmount: parseResult.totalAmount
        }),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        ua: req.headers.get('user-agent') || 'unknown',
      }
    })

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      inserted: insertedCount,
      skipped: skippedCount,
      totalAmount: parseResult.totalAmount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Commit error:', error)
    return NextResponse.json(
      { error: '登録中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
