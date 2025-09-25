import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@/server/prisma'
import { decrypt } from '@/server/crypto'

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

    const { memberId, deviceId, targetYen, selectedIds, note } = await req.json()
    
    if (!memberId || !selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      )
    }

    // ロックIDを生成
    const lockId = `L${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`

    // トランザクションで配分を確定
    const result = await prisma.$transaction(async (tx) => {
      // 選択されたコードが未配分かチェック
      const targetCodes = await tx.giftCode.findMany({
        where: {
          id: { in: selectedIds },
          status: 'UNASSIGNED'
        }
      })

      if (targetCodes.length !== selectedIds.length) {
        throw new Error('CONFLICT: 一部のコードが既に配分されています')
      }

      // ギフトコードを配分済みに更新
      const updateResult = await tx.giftCode.updateMany({
        where: {
          id: { in: selectedIds },
          status: 'UNASSIGNED'
        },
        data: {
          status: 'ASSIGNED',
          lockId,
          assignedAt: new Date(),
          memberId,
          deviceId,
          assignedByUserId: session.user.id
        }
      })

      if (updateResult.count !== selectedIds.length) {
        throw new Error('CONFLICT: 更新に失敗しました')
      }

      // 配分されたコードの詳細を取得
      const assignedCodes = await tx.giftCode.findMany({
        where: { lockId },
        include: {
          member: true,
          device: true
        }
      })

      const total = assignedCodes.reduce((sum, code) => sum + code.amount, 0)
      const diff = total - targetYen

      // 配分レコードを作成
      const allocation = await tx.allocation.create({
        data: {
          lockId,
          memberId,
          deviceId,
          target: targetYen,
          total,
          diff,
          status: 'CONFIRMED'
        }
      })

      // 配分項目を作成
      for (const code of assignedCodes) {
        await tx.allocationItem.create({
          data: {
            allocationId: allocation.id,
            giftCodeId: code.id,
            amount: code.amount
          }
        })
      }

      // 監査ログを記録
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: 'ALLOCATION_CONFIRM',
          entityType: 'Allocation',
          entityId: allocation.id,
          diffJson: JSON.stringify({
            memberId,
            deviceId,
            target: targetYen,
            total,
            diff,
            codeCount: assignedCodes.length,
            note
          }),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          ua: req.headers.get('user-agent') || 'unknown',
        }
      })

      // 配布用テキストを生成
      const member = assignedCodes[0]?.member
      const device = assignedCodes[0]?.device
      
      const distributionText = generateDistributionText({
        member: member?.name || 'Unknown',
        device: device?.name || 'Unknown',
        target: targetYen,
        total,
        diff,
        codes: assignedCodes.map(code => ({
          code: decrypt(code.codeEnc), // 復号化
          amount: code.amount
        }))
      })

      return {
        allocationId: allocation.id,
        lockId,
        total,
        diff,
        codeCount: assignedCodes.length,
        distributionText,
        member: member?.name,
        device: device?.name
      }
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Confirm error:', error)
    
    if (error.message.includes('CONFLICT')) {
      return NextResponse.json(
        { error: '他のユーザーによって既に配分されたコードが含まれています。再度提案を取得してください。' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: '配分の確定中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * 配布用テキストを生成
 */
function generateDistributionText(data: {
  member: string
  device: string
  target: number
  total: number
  diff: number
  codes: { code: string; amount: number }[]
}): string {
  const { member, device, target, total, diff, codes } = data
  
  let text = `【Apple ギフトコード配布】\n\n`
  text += `配布先: ${member}\n`
  text += `機種: ${device}\n`
  text += `目標金額: ¥${target.toLocaleString()}\n`
  text += `実際の合計: ¥${total.toLocaleString()}\n`
  text += `差額: ${diff >= 0 ? '+' : ''}¥${diff.toLocaleString()}\n`
  text += `コード数: ${codes.length}枚\n\n`
  
  text += `【ギフトコード一覧】\n`
  codes.forEach((code, index) => {
    text += `${index + 1}. ${code.code} - ¥${code.amount.toLocaleString()}\n`
  })
  
  text += `\n配布日時: ${new Date().toLocaleString('ja-JP')}\n`
  
  return text
}
