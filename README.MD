# Client Server Version

VSCode 확장과 자동 업데이트 서버를 포함한 프로젝트입니다.

## 🚀 주요 기능

- **VSCode 확장**: 클라이언트 측 애플리케이션
- **Node.js + Express 서버**: 백엔드 서버
- **자동 서버 업데이트**: 사용자 홈 디렉토리의 release 폴더에서 최신 버전 확인 및 자동 설치
- **VSCode 자동 리로드**: 업데이트 후 자동으로 VSCode 재시작

## 📁 프로젝트 구조

```
client-server-version/
├── client/                 # VSCode 확장
│   ├── src/
│   │   ├── extension.ts   # 확장 진입점
│   │   ├── serverManager.ts # 서버 설치/관리
│   │   ├── serverUpdater.ts # 업데이트 체크
│   │   └── types.ts       # 타입 정의
│   └── package.json
├── server/                 # Node.js 서버
│   ├── src/
│   │   └── index.ts       # Express 서버
│   ├── scripts/
│   │   └── release.js     # 릴리즈 스크립트
│   └── package.json
└── package.json            # 루트 설정
```

## 🛠️ 설치 및 빌드

### 의존성 설치
```bash
pnpm install
```

### 전체 프로젝트 빌드
```bash
pnpm build
```

### 서버 개발 모드
```bash
pnpm dev:server
```

## 📦 서버 릴리즈

### 릴리즈 생성
```bash
# 특정 버전으로 릴리즈
pnpm release:server 1.0.0

# 또는 서버 디렉토리에서 직접
cd server
pnpm release 1.0.0
```

### 릴리즈 프로세스
1. **버전 검증**: semver 형식 확인 (x.y.z)
2. **package.json 업데이트**: 버전 자동 변경
3. **서버 빌드**: TypeScript 컴파일
4. **zip 생성**: `server-v{version}.zip` 파일 생성
5. **사용자 홈 디렉토리로 이동**: `%USERPROFILE%\source\release\` 폴더에 배치

### zip 파일 구조
```
server-v1.0.0.zip
├── index.js          # 컴파일된 서버
├── package.json      # 버전 정보
└── README.md         # 문서
```

## 🔄 자동 업데이트 동작

### 1. VSCode 확장 활성화 시
- 사용자 홈 디렉토리의 `source\release` 폴더에서 최신 서버 버전 확인
- 로컬 서버와 버전 비교
- 새 버전이 있으면 자동 다운로드 및 설치
- VSCode 자동 리로드

### 2. 버전 확인 방식
- **zip 파일명 기반**: `server-v1.0.0.zip` → 버전 `1.0.0`
- **사용자 홈 디렉토리**: `%USERPROFILE%\source\release\` 폴더 스캔
- **로컬 메타데이터**: `server-info.json`에 설치 정보 저장

### 3. 설치 경로
```
%USERPROFILE%\server\
├── server.js
├── server-info.json
└── logs\
    └── server-actions-2024-01-15.log
```

### 4. 릴리즈 파일 위치
```
%USERPROFILE%\source\release\
├── server-v1.0.0.zip
├── server-v1.0.1.zip
└── server-v1.1.0.zip
```

## 📋 VSCode 명령어

- **Check Server Update**: 일반 업데이트 체크
- **Force Server Update**: 강제 업데이트
- **Show Server Status**: 서버 상태 표시

## 🔧 개발 환경

- **Node.js**: 최신 LTS 버전
- **TypeScript**: 5.0+
- **pnpm**: 패키지 매니저
- **VSCode**: 확장 개발 환경

## 📝 구현 상태

### ✅ 완료된 기능
- [x] VSCode 확장 기본 구조
- [x] 서버 자동 업데이트 로직
- [x] zip 파일명 기반 버전 관리
- [x] 릴리즈 스크립트
- [x] 로깅 시스템
- [x] 백업/복구 시스템
- [x] 사용자 홈 디렉토리 기반 릴리즈 관리

### 🚧 구현 예정
- [ ] 실제 zip 파일 다운로드/압축해제
- [ ] 체크섬 검증
- [ ] GitHub Actions 자동화

## 🎯 핵심 설계 원칙

1. **zip 파일명 기반 버전 관리**: 단순하고 신뢰할 수 있는 방식
2. **사용자 홈 디렉토리 기반**: `%USERPROFILE%\source\release\` 폴더 사용
3. **파일 기반 메타데이터**: 서버 실행 없이 버전 확인
4. **자동화된 릴리즈**: 버전 관리 및 패키징 자동화
5. **안전한 업데이트**: 백업/복구 시스템으로 안정성 보장

## 🚀 사용법

### 1. 릴리즈 생성
```bash
pnpm release:server 1.0.1
```

### 2. 릴리즈 파일 배치
생성된 `server-v1.0.1.zip` 파일을 `%USERPROFILE%\source\release\` 폴더로 이동

### 3. VSCode 확장 테스트
VSCode에서 확장을 활성화하면 자동으로 업데이트 체크 및 설치 수행
