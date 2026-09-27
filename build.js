const fs = require('fs');
const path = require('path');

// 폴더 경로 설정 (본인 프로젝트 구조에 맞게 폴더 이름 확인)
const articlesDir = path.join(__dirname, 'articles');
const postsDir = path.join(__dirname, 'posts');
const templatePath = path.join(__dirname, 'template.html');

// posts 폴더가 없으면 자동 생성
if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
}

// 템플릿 읽기
const templateHtml = fs.readFileSync(templatePath, 'utf-8');

// articles 폴더 안의 모든 JSON 파일 읽기
fs.readdir(articlesDir, (err, files) => {
    if (err) {
        console.error('articles 폴더를 읽지 못했습니다:', err);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.json') {
            const jsonFilePath = path.join(articlesDir, file);
            const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
            const article = JSON.parse(rawData);

            // content 배열을 <p> 태그 HTML로 변환
            const contentHtml = article.content
                .map(paragraph => `<p>${paragraph}</p>`)
                .join('\n');

            // OG 태그용 요약문 (본문 첫 줄 활용)
            const description = article.content[0] || "서오일보 기사 내용";

            // 템플릿의 빈칸을 JSON 데이터로 치환
            let html = templateHtml
                .replace(/{{TITLE}}/g, article.title)
                .replace(/{{CATEGORY}}/g, article.category)
                .replace(/{{DATE}}/g, article.date)
                .replace(/{{REPORTER}}/g, article.reporter)
                .replace(/{{REPORTER_AVATAR}}/g, article.reporterAvatar)
                .replace(/{{REPORTER_BIO}}/g, article.reporterBio)
                .replace(/{{IMAGE_URL}}/g, article.image.url)
                .replace(/{{IMAGE_CAPTION}}/g, article.image.caption || '')
                .replace(/{{CONTENT_HTML}}/g, contentHtml)
                .replace(/{{DESCRIPTION}}/g, description)
                .replace(/{{OG_URL}}/g, `https://여러분의넷플리파이주소.netlify.app/posts/${article.id}.html`);

            // posts 폴더 안에 id 이름으로 HTML 파일 생성 (예: posts/26092401.html)
            const outputFilePath = path.join(postsDir, `${article.id}.html`);
            fs.writeFileSync(outputFilePath, html, 'utf-8');
            console.log(`[성공] 기사 페이지 생성 완료: ${article.id}.html`);
        }
    });
});
