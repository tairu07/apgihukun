import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { bestComboDP } from '@/lib/alloc'

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

    const { targetYen, allowOver = true } = await req.json()
    
    if (!targetYen || typeof targetYen !== 'number' || targetYen <= 0) {
      return NextResponse.json(
        { error: '有効な目標金額を指定してください' },
        { status: 400 }
      )
    }

    // 未配分の在庫を取得
    const availableCodes = await prisma.giftCode.findMany({
      where: { 
        status: 'UNASSIGNED' 
      },
      select: { 
        id: true, 
        amount: true 
      },
      orderBy: {
        amount: 'desc' // 高額面から優先的に使用
      }
    })

    if (availableCodes.length === 0) {
      return NextResponse.json({
        success: true,
        proposal: {
          itemIds: [],
          sum: 0,
          diff: -targetYen,
          count: 0
        },
        availableCount: 0,
        availableTotal: 0
      })
    }

    // 利用可能な在庫の統計
    const availableTotal = availableCodes.reduce((sum, code) => sum + code.amount, 0)

    // 最適配分を計算
    const pool = availableCodes.map(code => ({
      id: code.id,
      amount: code.amount
    }))

    const proposal = bestComboDP(pool, targetYen, allowOver)

    // 提案の詳細情報を取得
    let proposalDetails = null
    if (proposal.itemIds.length > 0) {
      const selectedCodes = await prisma.giftCode.findMany({
        where: {
          id: { in: proposal.itemIds }
        },
        select: {
          id: true,
          amount: true,
          codeHash: true // マスク表示用
        }
      })

      proposalDetails = selectedCodes.map(code => ({
        id: code.id,
        amount: code.amount,
        maskedCode: `****${code.codeHash.substring(0, 4)}` // ハッシュの一部をマスクとして使用
      }))
    }

    return NextResponse.json({
      success: true,
      proposal: {
        ...proposal,
        details: proposalDetails
      },
      availableCount: availableCodes.length,
      availableTotal,
      targetYen,
      allowOver
    })
  } catch (error) {
    console.error('Propose error:', error)
    return NextResponse.json(
      { error: '提案の計算中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
