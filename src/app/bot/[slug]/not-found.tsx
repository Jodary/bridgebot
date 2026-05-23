import Link from "next/link";

export default function BotNotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-amber-50/30">
      <div className="text-center space-y-4">
        <p className="text-6xl">🤖</p>
        <h1 className="text-2xl font-semibold text-gray-800">找不到这个 Bot</h1>
        <p className="text-gray-500">该 Bot 可能已被删除，或链接地址错误。</p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
