const fs = require('fs');
const path = require('path');

// ★ [설정] 본인의 깃허브 아이디와 저장소(프로젝트) 이름으로 수정해주세요!
const GITHUB_USER = '김서오 아이디(예: seoo)'; // 예: 'seoo'
const REPO_NAME = 'seo-weekly-test';           // 예: 'seo-weekly-test'

// GitHub Pages 전용 기본 URL (예: https://seoo.github.io/seo-weekly-test)
const BASE_URL = `https://${GITHUB_USER}.github.io/${REPO_NAME}`;

// 1. 출력할 'dist' 폴더 생성
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir, { recursive: true });
}

// 2. 파일 복사 함수
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    if (stats && stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// 주요 폴더 및 파일 복사
if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));
}
if (fs.existsSync(path.join(__dirname, 'viewer.html'))) {
    fs.copyFileSync(path.join(__dirname, 'viewer.html'), path.join(distDir, 'viewer.html'));
}
if (fs.existsSync(path.join(__dirname, 'articles'))) {
    copyRecursiveSync(path.join(__dirname, 'articles'), path.join(distDir, 'articles'));
}
if (fs.existsSync(path.join(__dirname, 'images'))) {
    copyRecursiveSync(path.join(__dirname, 'images'), path.join(distDir, 'images'));
}
// 추가로 assets 폴더가 있다면 복사
if (fs.existsSync(path.join(__dirname, 'assets'))) {
    copyRecursiveSync(path.join(__dirname, 'assets'), path.join(distDir, 'assets'));
}

// 3. 각 기사별 전용 HTML(OG 태그 포함) 생성
const articlesDir = path.join(__dirname, 'articles');
const postDir = path.join(distDir, 'post');
if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true });
}

if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir);
    files.forEach(file => {
        if (path.extname(file) === '.json') {
            const articleId = path.basename(file, '.json');
            const articleData = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf8'));

            // 본문 요약 추출
            let summaryText = "";
            if (Array.isArray(articleData.content) && articleData.content.length > 0) {
                const firstItem = articleData.content[0];
                if (typeof firstItem === 'string') {
                    summaryText = firstItem;
                } else if (typeof firstItem === 'object' && firstItem !== null && firstItem.value) {
                    summaryText = firstItem.value;
                }
            } else if (typeof articleData.content === 'string') {
                summaryText = articleData.content;
            }
            summaryText = summaryText.substring(0, 100);

            // 이미지 주소 정밀 가공 (프로젝트 이름이 빠지지 않도록 절대 경로로 조합)
            let imgUrl = `${BASE_URL}/images/default-logo.png`; // 기본 이미지
            if (articleData.image) {
                let rawImg = "";
                if (typeof articleData.image === 'string') {
                    rawImg = articleData.image;
                } else if (typeof articleData.image === 'object' && articleData.image.url) {
                    rawImg = articleData.image.url;
                }

                if (rawImg.trim() !== "") {
                    if (rawImg.startsWith('http://') || rawImg.startsWith('https://')) {
                        imgUrl = rawImg;
                    } else {
                        // 상대 경로인 경우 앞에 올바른 BASE_URL과 프로젝트 경로 결합
                        imgUrl = `${BASE_URL}/${rawImg.replace(/^\//, '')}`;
                    }
                }
            }

            // 각 기사별 페이지 주소 (프로젝트 이름 포함)
            const postUrl = `${BASE_URL}/post/${articleId}.html`;
            // 리다이렉트될 뷰어 주소 (프로젝트 이름 포함)
            const redirectUrl = `/${REPO_NAME}/viewer.html?id=${articleId}`;

            // 기사별 HTML 내용 생성
            const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>${articleData.title} - 서오일보</title>
    <meta property="og:title" content="${articleData.title}">
    <meta property="og:description" content="${summaryText}">
    <meta property="og:image" content="${imgUrl}">
    <meta property="og:url" content="${postUrl}">
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
</head>
<body>
    <p>기사 페이지로 이동 중입니다...</p>
</body>
</html>`;

            fs.writeFileSync(path.join(postDir, `${articleId}.html`), htmlContent);
        }
    });
    console.log('✨ 프로젝트 경로가 반영된 기사별 OG HTML 생성 완료!');
}
