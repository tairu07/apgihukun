'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Stats = {
  unassigned: { count: number; total: number }
  assigned: { count: number; total: number }
  overall: { count: number; total: number }
  monthly: { allocations: number; totalAmount: number }
}

type RecentAllocation = {
  id: string
  memberName: string
  deviceName: string
  target: number
  total: number
  diff: number
  createdAt: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentAllocations, setRecentAllocations] = useState<RecentAllocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return // まだ読み込み中
    if (!session) router.push('/auth/signin')
  }, [session, status, router])

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/inventory/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentAllocations(data.recentAllocations)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Apple ギフトコード管理システム
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                ようこそ、{session.user.name || session.user.email}さん
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {session.user.role}
                </span>
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 概要カード */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">¥</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        未配分在庫合計
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {loading ? '...' : `¥${(stats?.unassigned.total || 0).toLocaleString()}`}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">#</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        未配分コード数
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {loading ? '...' : `${stats?.unassigned.count || 0}件`}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        今月の配分数
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {loading ? '...' : `${stats?.monthly.allocations || 0}件`}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">💰</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        今月の配分額
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {loading ? '...' : `¥${(stats?.monthly.totalAmount || 0).toLocaleString()}`}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 機能メニュー */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">在庫取り込み</h3>
              <p className="text-gray-600 mb-4 text-sm">
                ギフトコードをテキストで貼り付けて在庫に登録
              </p>
              <Link href="/inventory/import" className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-center">
                取り込み開始
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">在庫一覧</h3>
              <p className="text-gray-600 mb-4 text-sm">
                現在の在庫状況を確認・管理
              </p>
              <Link href="/inventory" className="block w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-center">
                在庫確認
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">最適配分</h3>
              <p className="text-gray-600 mb-4 text-sm">
                目標金額に最も近い組み合わせを自動提案
              </p>
              <Link href="/allocate" className="block w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-center">
                配分開始
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">履歴管理</h3>
              <p className="text-gray-600 mb-4 text-sm">
                配分履歴と監査ログの確認
              </p>
              <Link href="/history" className="block w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-center">
                履歴確認
              </Link>
            </div>
          </div>

          {/* 最近の配分履歴 */}
          {recentAllocations.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  最近の配分履歴
                </h3>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          配布先
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          機種
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          目標金額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          実際の金額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          差額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          配分日時
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentAllocations.map((allocation) => (
                        <tr key={allocation.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {allocation.memberName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {allocation.deviceName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ¥{allocation.target.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ¥{allocation.total.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`${allocation.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {allocation.diff >= 0 ? '+' : ''}¥{allocation.diff.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(allocation.createdAt).toLocaleString('ja-JP')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
