# 게시판 및 키워드 알림 서비스

## 1. 간단소개

이 프로젝트는 NestJS와 MySQL을 기반으로 한 게시판 서비스입니다.  
게시글 작성, 수정, 삭제 및 댓글 작성, 삭제 기능을 지원하며,  
특정 키워드가 포함된 게시글이나 댓글이 등록될 때 키워드 등록자에게 알림을 보내는 키워드 알림 기능을 포함하고 있습니다.

---

## 2. 저장소 클론 및 패키지 설치

```bash
git clone <REPOSITORY_URL>
cd <PROJECT_FOLDER>

# npm 사용 시
npm install

# 또는 yarn 사용 시
yarn install
```

## 3. MySQL 데이터베이스 설정

- MySQL 서버가 실행 중인지 확인하세요. (로컬 또는 도커 환경)
- 데이터베이스 생성 예시 (MySQL 클라이언트에서 실행):

```sql
CREATE DATABASE ${database_name};
```

## 4. 환경변수 설정

- 프로젝트 루트에 있는 .env.example 파일을 .env로 복사 후 수정하세요:

```bash
cp .env.example .env
```

- .env 파일에서 DB 접속 정보 등 환경변수를 본인 환경에 맞게 수정합니다.

## 5. DB 스키마 생성

- 준비된 스키마 파일 scripts/schema.sql을 아래 명령어로 실행하여 테이블을 생성하세요:

```bash
mysql -h ${db_host} -P ${port} -u ${username} -p ${database_name} < scripts/schema.sql
```

- 명령어 실행 후 비밀번호 입력 프롬프트가 나타납니다.

## 6. 프로그램 실행

- 서버 실행:

```bash
yarn run start
npm run start
```

- 단위 테스트 실행:

```bash
yarn run test
npm run test
```
