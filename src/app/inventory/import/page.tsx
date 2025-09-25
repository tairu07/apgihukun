'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ParsedCode = {
  code: string
  amount: number
  lineNumber: number
  isValid: boolean
  error?: string
}

type ParseResult = {
  codes: ParsedCode[]
  totalAmount: number
  validCount: number
  invalidCount: number
  duplicateCount: number
}

export default function ImportInventory() {
  const { data: session } = useSession()
  const router = useRouter()
  const [rawText, setRawText] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const handleParse = async () => {
    if (!rawText.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/inventory/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      })

      if (response.ok) {
        const data = await response.json()
        setParseResult(data.result)
      } else {
        alert('解析に失敗しました')
      }
    } catch (error) {
      console.error('Parse error:', error)
      alert('解析中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!parseResult || parseResult.validCount === 0) return

    setImporting(true)
    try {
      const response = await fetch('/api/inventory/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawText,
          batchTitle: `Import ${new Date().toISOString()}`
        })
      })

      if (response.ok) {
        const data = await response.json()
        setImportResult(data)
        setRawText('')
        setParseResult(null)
      } else {
        const error = await response.json()
        alert(`登録に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('登録中にエラーが発生しました')
    } finally {
      setImporting(false)
    }
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
                在庫取り込み
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 成功メッセージ */}
          {importResult && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-400">✓</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    在庫の取り込みが完了しました
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>登録件数: {importResult.inserted}件</p>
                    <p>スキップ件数: {importResult.skipped}件</p>
                    <p>合計金額: ¥{importResult.totalAmount?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 入力エリア */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  ギフトコードの貼り付け
                </h3>
                
                <div className="mb-4">
                  <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
                    テキストを貼り付けてください
                  </label>
                  <textarea
                    id="rawText"
                    rows={12}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
                    placeholder="例:&#10;ABCD1234EFGH5678 ¥1,000&#10;IJKL5678MNOP9012 ¥3,000&#10;QRST3456UVWX7890 ¥5,000"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleParse}
                    disabled={!rawText.trim() || loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {loading ? '解析中...' : '解析'}
                  </button>
                  
                  {parseResult && parseResult.validCount > 0 && (
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      {importing ? '登録中...' : `${parseResult.validCount}件を登録`}
                    </button>
                  )}
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <p><strong>対応形式:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>ABCD1234EFGH5678 ¥1,000</li>
                    <li>ABCD1234EFGH5678 1000</li>
                    <li>¥1,000 ABCD1234EFGH5678</li>
                    <li>タブ区切りにも対応</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 解析結果 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  解析結果
                </h3>

                {parseResult ? (
                  <div>
                    {/* 統計 */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-sm font-medium text-green-800">有効</div>
                        <div className="text-2xl font-bold text-green-900">{parseResult.validCount}</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded">
                        <div className="text-sm font-medium text-red-800">無効</div>
                        <div className="text-2xl font-bold text-red-900">{parseResult.invalidCount}</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm font-medium text-blue-800">合計金額</div>
                        <div className="text-lg font-bold text-blue-900">¥{parseResult.totalAmount.toLocaleString()}</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded">
                        <div className="text-sm font-medium text-yellow-800">重複</div>
                        <div className="text-2xl font-bold text-yellow-900">{parseResult.duplicateCount}</div>
                      </div>
                    </div>

                    {/* 詳細リスト */}
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">行</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">コード</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {parseResult.codes.map((code, index) => (
                            <tr key={index} className={code.isValid ? '' : 'bg-red-50'}>
                              <td className="px-3 py-2 text-sm text-gray-900">{code.lineNumber}</td>
                              <td className="px-3 py-2 text-sm font-mono">
                                {code.code ? `${code.code.substring(0, 4)}****${code.code.substring(12)}` : '-'}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {code.amount > 0 ? `¥${code.amount.toLocaleString()}` : '-'}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {code.isValid ? (
                                  <span className="text-green-600">✓ 有効</span>
                                ) : (
                                  <span className="text-red-600" title={code.error}>✗ {code.error}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    テキストを貼り付けて「解析」ボタンを押してください
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
