'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Member = {
  id: string
  name: string
  contact?: string
}

type Device = {
  id: string
  name: string
  targetPrice: number
}

type Proposal = {
  itemIds: string[]
  sum: number
  diff: number
  count: number
  details?: Array<{
    id: string
    amount: number
    maskedCode: string
  }>
}

export default function AllocatePage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [members, setMembers] = useState<Member[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedDevice, setSelectedDevice] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [allowOver, setAllowOver] = useState(true)
  
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [proposing, setProposing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState<any>(null)

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  useEffect(() => {
    fetchMembersAndDevices()
  }, [])

  const fetchMembersAndDevices = async () => {
    try {
      // メンバーとデバイスのデータを取得（シードデータから）
      setMembers([
        { id: 'member1', name: '田中太郎', contact: 'tanaka@example.com' },
        { id: 'member2', name: '佐藤花子', contact: 'sato@example.com' }
      ])
      setDevices([
        { id: 'device1', name: 'iPhone 15 Pro', targetPrice: 159800 },
        { id: 'device2', name: 'MacBook Air M3', targetPrice: 164800 }
      ])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId)
    const device = devices.find(d => d.id === deviceId)
    if (device) {
      setTargetAmount(device.targetPrice.toString())
    }
  }

  const handlePropose = async () => {
    if (!targetAmount || !selectedMember) return

    setProposing(true)
    try {
      const response = await fetch('/api/allocate/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetYen: parseInt(targetAmount),
          allowOver
        })
      })

      if (response.ok) {
        const data = await response.json()
        setProposal(data.proposal)
      } else {
        const error = await response.json()
        alert(`提案の取得に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Propose error:', error)
      alert('提案の取得中にエラーが発生しました')
    } finally {
      setProposing(false)
    }
  }

  const handleConfirm = async () => {
    if (!proposal || !selectedMember || !targetAmount) return

    setConfirming(true)
    try {
      const response = await fetch('/api/allocate/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember,
          deviceId: selectedDevice || null,
          targetYen: parseInt(targetAmount),
          selectedIds: proposal.itemIds
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConfirmed(data)
        setProposal(null)
        setSelectedMember('')
        setSelectedDevice('')
        setTargetAmount('')
      } else {
        const error = await response.json()
        alert(`配分の確定に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Confirm error:', error)
      alert('配分の確定中にエラーが発生しました')
    } finally {
      setConfirming(false)
    }
  }

  const downloadDistributionText = () => {
    if (!confirmed?.distributionText) return
    
    const blob = new Blob([confirmed.distributionText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gift_codes_${confirmed.member}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← ダッシュボードに戻る
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                最適配分
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 成功メッセージ */}
          {confirmed && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-400">✓</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    配分が完了しました
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>配布先: {confirmed.member}</p>
                    <p>機種: {confirmed.device}</p>
                    <p>合計金額: ¥{confirmed.total?.toLocaleString()}</p>
                    <p>差額: {confirmed.diff >= 0 ? '+' : ''}¥{confirmed.diff?.toLocaleString()}</p>
                    <p>コード数: {confirmed.codeCount}枚</p>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={downloadDistributionText}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      配布用テキストをダウンロード
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 配分設定 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  配分設定
                </h3>

                <div className="space-y-4">
                  {/* メンバー選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      配布先メンバー
                    </label>
                    <select
                      value={selectedMember}
                      onChange={(e) => setSelectedMember(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">選択してください</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.contact})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* デバイス選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      機種（任意）
                    </label>
                    <select
                      value={selectedDevice}
                      onChange={(e) => handleDeviceChange(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">選択してください</option>
                      {devices.map(device => (
                        <option key={device.id} value={device.id}>
                          {device.name} (¥{device.targetPrice.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 目標金額 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      目標金額（円）
                    </label>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="例: 160000"
                    />
                  </div>

                  {/* オプション */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={allowOver}
                        onChange={(e) => setAllowOver(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        目標金額を超過することを許可
                      </span>
                    </label>
                  </div>

                  {/* 提案ボタン */}
                  <button
                    onClick={handlePropose}
                    disabled={!selectedMember || !targetAmount || proposing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium"
                  >
                    {proposing ? '計算中...' : '最適配分を提案'}
                  </button>
                </div>
              </div>
            </div>

            {/* 提案結果 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  提案結果
                </h3>

                {proposal ? (
                  <div>
                    {/* 概要 */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm font-medium text-blue-800">合計金額</div>
                        <div className="text-xl font-bold text-blue-900">¥{proposal.sum.toLocaleString()}</div>
                      </div>
                      <div className={`p-3 rounded ${proposal.diff >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className={`text-sm font-medium ${proposal.diff >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                          差額
                        </div>
                        <div className={`text-xl font-bold ${proposal.diff >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                          {proposal.diff >= 0 ? '+' : ''}¥{proposal.diff.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm font-medium text-gray-800">使用枚数</div>
                        <div className="text-xl font-bold text-gray-900">{proposal.count}枚</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <div className="text-sm font-medium text-purple-800">目標金額</div>
                        <div className="text-xl font-bold text-purple-900">¥{parseInt(targetAmount).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* 詳細リスト */}
                    {proposal.details && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">使用するギフトコード</h4>
                        <div className="max-h-48 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">コード</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {proposal.details.map((detail, index) => (
                                <tr key={detail.id}>
                                  <td className="px-3 py-2 text-sm font-mono">{detail.maskedCode}</td>
                                  <td className="px-3 py-2 text-sm">¥{detail.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 確定ボタン */}
                    <button
                      onClick={handleConfirm}
                      disabled={confirming}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium"
                    >
                      {confirming ? '確定中...' : '配分を確定'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    配分設定を入力して「最適配分を提案」ボタンを押してください
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
