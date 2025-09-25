import Link from 'next/link'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Apple ギフトコード管理システム
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Appleギフトコードの在庫管理と最適配分を行うシステムです
        </p>
        
        <div className="mb-8">
          <Link
            href="/auth/signin"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-medium"
          >
            ログインして開始
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-3">在庫取り込み</h2>
            <p className="text-gray-600 mb-4">
              ギフトコードをテキストで貼り付けて在庫に登録
            </p>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded text-sm">
              ログイン後に利用可能
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-3">最適配分</h2>
            <p className="text-gray-600 mb-4">
              目標金額に最も近い組み合わせを自動提案
            </p>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded text-sm">
              ログイン後に利用可能
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-3">履歴管理</h2>
            <p className="text-gray-600 mb-4">
              配分履歴と監査ログの確認
            </p>
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded text-sm">
              ログイン後に利用可能
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
