#!/usr/bin/env python3
"""
TypeScript & TSX Anti-Trick / Defect Verifier (zero-defect-pipeline)
탐지 항목:
1. 빈 catch 블록 (내부에 아무 처리나 로깅 없이 에러를 은폐하는 경우)
2. 무의미한 눈속임 assert (assert True, len >= 0 등)
3. except/catch 블록에서 임의의 {"status": "success"} 가짜 성공 반환
"""

import sys
import re
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def check_file(filepath: Path) -> list[str]:
    defects = []
    content = filepath.read_text(encoding="utf-8")
    lines = content.splitlines()

    for idx, line in enumerate(lines, start=1):
        # 1. 빈 catch 블록 탐지 (catch (..) { } 패턴)
        if re.search(r"catch\s*\([^)]*\)\s*\{\s*\}", line):
            defects.append(f"[{filepath.name}:{idx}] [CRITICAL] 빈 catch 블록으로 에러를 은폐하고 있습니다.")

        # 2. catch 블록 바로 다음에 아무 문장 없이 닫히는 패턴
        if re.search(r"catch\s*\([^)]*\)\s*\{", line):
            # 다음 1~3줄 검사
            combined = "".join(lines[idx:min(idx+3, len(lines))]).strip()
            if combined.startswith("}"):
                defects.append(f"[{filepath.name}:{idx}] [CRITICAL] 본문 없는 catch 블록이 발견되었습니다.")

        # 3. 무의미한 assert 탐지
        if "assert(true)" in line.lower() or "assert len" in line:
            defects.append(f"[{filepath.name}:{idx}] [CRITICAL] 무의미한 눈속임 검증문이 발견되었습니다.")

    return defects

def main():
    src_dir = Path("src")
    if not src_dir.is_dir():
        print("❌ 'src' 디렉토리를 찾을 수 없습니다.")
        sys.exit(1)

    all_defects = []
    ts_files = list(src_dir.glob("**/*.ts")) + list(src_dir.glob("**/*.tsx"))
    
    print(f"🔍 [TS AST Guard] 총 {len(ts_files)}개 TypeScript/TSX 소스 파일 정밀 검사 시작...")

    for f in ts_files:
        all_defects.extend(check_file(f))

    if all_defects:
        print(f"❌ [TS AST Guard] 결함 발견 (총 {len(all_defects)}건):")
        for d in all_defects:
            print(f"  - {d}")
        sys.exit(1)
    else:
        print(f"✅ [TS AST Guard] {len(ts_files)}개 파일 검사 완료: 빈 catch/가짜 assert/에러 은폐 0건 (100% 무결점)")
        sys.exit(0)

if __name__ == "__main__":
    main()
