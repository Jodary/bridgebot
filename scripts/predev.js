// 每次 npm run dev 前自动删除 Windows NUL 设备文件
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const nulPath = path.join(projectRoot, "nul");

// 检查 nul 是否存在（通过 readdir 检测）
try {
  const files = fs.readdirSync(projectRoot);
  if (files.includes("nul")) {
    // 使用 PowerShell 通过 \\?\ 前缀绕过 Windows 保留名限制删除
    const psPath = `\\\\?\\${projectRoot}\\nul`;
    try {
      execSync(
        `powershell -NoProfile -Command "Remove-Item -Path '${psPath}' -Force -ErrorAction SilentlyContinue"`,
        { stdio: "ignore", timeout: 5000 }
      );
    } catch {
      // 如果 PowerShell 失败，尝试用 Node 直接删除
      try {
        fs.rmSync(psPath, { force: true });
      } catch {
        // 忽略
      }
    }
  }
} catch {
  // 忽略所有错误，不阻塞 dev 启动
}
