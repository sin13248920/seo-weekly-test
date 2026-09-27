const fs = require('fs');
const path = require('path');

// 1. 출력할 'dist' 폴더 생성 (여기가 넷플리파이 publish directory가 됩니다)
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)){
    fs.mkdirSync(distDir, { recursive: true });
}

// 2. 기본 파일들(index.html, articles 폴더, images 등)을 dist 폴더로 복사
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

// index.html 복사
if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));
}
// viewer.html 복사
if (fs.existsSync(path.join(__dirname, 'viewer.html'))) {
    fs.copyFileSync(path.join(__dirname, 'viewer.html'), path.join(distDir, 'viewer.html'));
}
// articles 폴더 복사
if (fs.existsSync(path.join(__dirname, 'articles'))) {
    copyRecursiveSync(path.join(__dirname, 'articles'), path.join(distDir, 'articles'));
}
// images 폴더 복사
if (fs.existsSync(path.join(__dirname, 'images'))) {
    copyRecursiveSync(path.join(__dirname, 'images'), path.join(distDir, 'images'));
}

// 3. articles 안의 JSON들을 읽어서 각 기사별 전용 HTML(OG 태그가 박힌 파일) 생성
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

            // ★ [수정됨] content가 배열이든 문자열이든 에러 안 나게 안전하게 글자 추출하는 로직
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

            // 이미지 경로 안전하게 처리 (문자열 혹은 객체 대응)
            let imgUrl = 'https://your-domain.netlify.app/images/default-logo.png';
            if (articleData.image) {
                if (typeof articleData.image === 'string') {
                    imgUrl = articleData.image;
                } else if (typeof articleData.image === 'object' && articleData.image.url) {
                    imgUrl = articleData.image.url;
                }
            }

            // 각 기사 전용 HTML 생성
            const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>${articleData.title} - 서오일보</title>
    <meta property="og:title" content="${articleData.title}">
    <meta property="og:description" content="${summaryText}">
    <meta property="og:image" content="${imgUrl}">
    <meta property="og:url" content="https://your-domain.netlify.app/post/${articleId}.html">
    <meta http-equiv="refresh" content="0;url=/viewer.html?id=${articleId}">
</head>
<body>
    <p>기사 페이지로 이동 중입니다...</p>
</body>
</html>`;

            fs.writeFileSync(path.join(postDir, `${articleId}.html`), htmlContent);
        }
    });
    console.log('✨ 기사별 OG HTML 생성 완료!');
}
