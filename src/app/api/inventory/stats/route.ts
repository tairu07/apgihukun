import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'
import { prisma } from '@/server/prisma'

export async function GET(req: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 在庫統計を並列で取得
    const [
      unassignedStats,
      assignedStats,
      totalStats,
      recentAllocations,
      amountDistribution
    ] = await Promise.all([
      // 未配分在庫
      prisma.giftCode.aggregate({
        where: { status: 'UNASSIGNED' },
        _count: { id: true },
        _sum: { amount: true }
      }),
      
      // 配分済み在庫
      prisma.giftCode.aggregate({
        where: { status: 'ASSIGNED' },
        _count: { id: true },
        _sum: { amount: true }
      }),
      
      // 全体統計
      prisma.giftCode.aggregate({
        _count: { id: true },
        _sum: { amount: true }
      }),
      
      // 最近の配分履歴（5件）
      prisma.allocation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          member: { select: { name: true } },
          device: { select: { name: true } }
        }
      }),
      
      // 額面分布
      prisma.$queryRaw`
        SELECT amount, COUNT(*) as count, status
        FROM gift_codes 
        WHERE status IN ('UNASSIGNED', 'ASSIGNED')
        GROUP BY amount, status
        ORDER BY amount DESC
      `
    ])

    // 今月の配分統計
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    
    const monthlyAllocations = await prisma.allocation.aggregate({
      where: {
        createdAt: { gte: thisMonth },
        status: 'CONFIRMED'
      },
      _count: { id: true },
      _sum: { total: true }
    })

    return NextResponse.json({
      success: true,
      stats: {
        unassigned: {
          count: unassignedStats._count.id || 0,
          total: unassignedStats._sum.amount || 0
        },
        assigned: {
          count: assignedStats._count.id || 0,
          total: assignedStats._sum.amount || 0
        },
        overall: {
          count: totalStats._count.id || 0,
          total: totalStats._sum.amount || 0
        },
        monthly: {
          allocations: monthlyAllocations._count.id || 0,
          totalAmount: monthlyAllocations._sum.total || 0
        }
      },
      recentAllocations: recentAllocations.map(allocation => ({
        id: allocation.id,
        memberName: allocation.member?.name || 'Unknown',
        deviceName: allocation.device?.name || 'Unknown',
        target: allocation.target,
        total: allocation.total,
        diff: allocation.diff,
        createdAt: allocation.createdAt
      })),
      amountDistribution
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: '統計の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
